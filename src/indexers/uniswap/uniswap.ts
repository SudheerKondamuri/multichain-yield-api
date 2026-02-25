import axios from "axios";
import {
  UNISWAP_SUBGRAPH_IDS,
  TRACKED_TOKEN_ADDRESSES
} from "../../config/constants";

export async function fetchUniswapYields(
  chain: "ethereum" | "arbitrum" | "polygon"
) {
  const subgraphId = UNISWAP_SUBGRAPH_IDS[chain];
  if (!subgraphId) return [];

  const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${subgraphId}`;

  const trackedAddresses = new Set(
    Object.values(TRACKED_TOKEN_ADDRESSES[chain])
      .filter((addr): addr is string => typeof addr === "string")
      .map((addr) => addr.toLowerCase())
  );

  if (!trackedAddresses.size) return [];

  const query = `
  {
    pools(
      first: 100
      orderBy: totalValueLockedUSD
      orderDirection: desc
      where: { totalValueLockedUSD_gt: "500000" }
    ) {
      id
      feeTier
      totalValueLockedUSD
      token0 { id symbol }
      token1 { id symbol }
      poolDayData(first: 7, orderBy: date, orderDirection: desc) {
        volumeUSD
      }
    }
  }
  `;

  try {
    const response = await axios.post(url, { query });
    const pools = response.data?.data?.pools || [];

    const filtered = pools.filter((pool: any) => {
      const token0 = pool.token0?.id?.toLowerCase();
      const token1 = pool.token1?.id?.toLowerCase();

      return (
        trackedAddresses.has(token0) &&
        trackedAddresses.has(token1)
      );
    });

    const results = filtered.map((pool: any) => {
      const tvl = Number(pool.totalValueLockedUSD);
      if (!tvl) return null;

      const volumes = pool.poolDayData || [];
      const totalVolume = volumes.reduce(
        (sum: number, day: any) => sum + Number(day.volumeUSD || 0),
        0
      );

      const avgDailyVolume =
        volumes.length > 0 ? totalVolume / volumes.length : 0;

      const feeFactor = Number(pool.feeTier) / 1000000;
      const annualFees = avgDailyVolume * feeFactor * 365;
      const apr = tvl > 0 ? annualFees / tvl : 0;

      return {
        protocol: "Uniswap V3",
        chain,
        asset: `${pool.token0.symbol}/${pool.token1.symbol}`,
        apr: Number((apr * 100).toFixed(2)), 
        tvl: Math.round(tvl),
        poolAddress: pool.id,
        feeTier: `${(feeFactor * 100).toFixed(2)}%`,
        lastUpdated: new Date().toISOString()
      };
    });

    return results
      .filter(Boolean)
      .sort((a: any, b: any) => b.tvl - a.tvl);

  } catch (error) {
    console.error(`Uniswap Indexer Error [${chain}]:`, error);
    return [];
  }
}