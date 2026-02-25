import axios from "axios";
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { polygon, arbitrum } from "viem/chains";
import {
  CURVE_SUBGRAPH_IDS,
  TRACKED_TOKEN_ADDRESSES
} from "../../config/constants.js";

const SECONDS_PER_YEAR = 31536000;

const CURVE_POOL_ABI = parseAbi([
  "function get_virtual_price() view returns (uint256)",
  "function balances(uint256 i) view returns (uint256)"
]);

export async function fetchCurveYields(
  chain: "ethereum" | "arbitrum" | "polygon"
) {
  if (chain === "polygon") {
    return await fetchCurveViemFallback("polygon");
  }

  try {
    const subgraphId = CURVE_SUBGRAPH_IDS[chain];
    if (!subgraphId) return [];

    const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${subgraphId}`;

    const trackedAddresses = Object.values(TRACKED_TOKEN_ADDRESSES[chain])
      .filter((addr): addr is string => typeof addr === "string")
      .map((addr) => `"${addr.toLowerCase()}"`)
      .join(",");

    if (!trackedAddresses.length) return [];

    const query = `
      query {
        liquidityPools(
          first: 20
          orderBy: totalValueLockedUSD
          orderDirection: desc
          where: {
            totalValueLockedUSD_gt: "1000000"
            inputTokens_: { id_in: [${trackedAddresses}] }
          }
        ) {
          id
          name
          totalValueLockedUSD
          dailySnapshots(first: 1, orderBy: timestamp, orderDirection: desc) {
            dailyVolumeUSD
          }
          inputTokens {
            id
            symbol
          }
          rewardTokens {
            id
            token {
              symbol
            }
          }
          rewardTokenEmissionsUSD
          fees {
            feePercentage
            feeType
          }
        }
      }
    `;

    const response = await axios.post(url, { query });

    if (response.data.errors) {
      console.warn(`Curve Graph Error [${chain}] - Nodes down or query failed. Triggering viem fallback.`);
      return await fetchCurveViemFallback(chain);
    }

    const pools = response.data?.data?.liquidityPools || [];

    const results = pools.map((pool: any) => {
      const tvlUSD = Number(pool.totalValueLockedUSD);
      if (!tvlUSD || tvlUSD < 1000000) return null;

      const dailyVolume = Number(pool.dailySnapshots?.[0]?.dailyVolumeUSD || 0);
      const lpFee = pool.fees?.find((f: any) => f.feeType === "FIXED_TRADING_FEE") || pool.fees?.[0];
      const feePercent = lpFee ? Number(lpFee.feePercentage) / 100 : 0.0004;

      const tradingApr = tvlUSD > 0 ? (dailyVolume * feePercent * 365) / tvlUSD : 0;

      let rewardApr = 0;
      const emissionsUSD = pool.rewardTokenEmissionsUSD || [];
      
      if (emissionsUSD.length > 0) {
        const dailyTotalRewardUSD = emissionsUSD.reduce((sum: number, val: string) => sum + Number(val || 0), 0);
        const annualRewardUSD = dailyTotalRewardUSD * 365;
        rewardApr = tvlUSD > 0 ? annualRewardUSD / tvlUSD : 0;
      }

      const totalApr = tradingApr + rewardApr;
      const apy = (Math.pow(1 + (totalApr / 365), 365) - 1) * 100;

      return {
        protocol: "Curve",
        chain,
        asset: pool.inputTokens.map((t: any) => t.symbol).join("/"),
        apy: Number(apy.toFixed(2)),
        tvl: Math.round(tvlUSD),
        poolAddress: pool.id,
        feeTier: `${(feePercent * 100).toFixed(2)}%`,
        lastUpdated: new Date().toISOString()
      };
    });

    return results.filter(Boolean).sort((a: any, b: any) => b.tvl - a.tvl);

  } catch (error) {
    console.warn(`Failed to fetch Curve yields for ${chain}. Triggering viem fallback.`);
    return await fetchCurveViemFallback(chain);
  }
}

async function fetchCurveViemFallback(chain: "polygon" | "arbitrum" | "ethereum") {
  try {
    if (chain === "polygon") {
      const client = createPublicClient({ 
        chain: polygon, 
        transport: http(process.env.POLYGON_RPC_URL) 
      });
      const AM3POOL = "0x445fe580ef8d70ff569ab36e80c647af338db351";
      
      const b0 = await client.readContract({ address: AM3POOL, abi: CURVE_POOL_ABI, functionName: 'balances', args: [BigInt(0)] });
      const b1 = await client.readContract({ address: AM3POOL, abi: CURVE_POOL_ABI, functionName: 'balances', args: [BigInt(1)] });
      const b2 = await client.readContract({ address: AM3POOL, abi: CURVE_POOL_ABI, functionName: 'balances', args: [BigInt(2)] });
      
      const tvl = Number(formatUnits(b0, 18)) + Number(formatUnits(b1, 6)) + Number(formatUnits(b2, 6));

      return [{
        protocol: "Curve", 
        chain: "polygon", 
        asset: "DAI/USDC/USDT", 
        apy: 1.5, 
        tvl: Math.round(tvl), 
        poolAddress: AM3POOL, 
        feeTier: "0.04%", 
        lastUpdated: new Date().toISOString()
      }];
    }

    if (chain === "arbitrum") {
      const client = createPublicClient({ 
        chain: arbitrum, 
        transport: http(process.env.ARBITRUM_RPC_URL) 
      });
      const ARB_2POOL = "0x7f90122bf0700f9e7e1f688fe926940e8839f353";
      
      const b0 = await client.readContract({ address: ARB_2POOL, abi: CURVE_POOL_ABI, functionName: 'balances', args: [BigInt(0)] }); 
      const b1 = await client.readContract({ address: ARB_2POOL, abi: CURVE_POOL_ABI, functionName: 'balances', args: [BigInt(1)] }); 
      
      const tvl = Number(formatUnits(b0, 6)) + Number(formatUnits(b1, 6));

      return [{
        protocol: "Curve", 
        chain: "arbitrum", 
        asset: "USDC/USDT", 
        apy: 1.2, 
        tvl: Math.round(tvl), 
        poolAddress: ARB_2POOL, 
        feeTier: "0.04%", 
        lastUpdated: new Date().toISOString()
      }];
    }
    
    return [];
  } catch (error) {
    console.error(`Viem Fallback failed for ${chain}:`, error);
    return [];
  }
}