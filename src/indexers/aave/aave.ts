import axios from "axios";
import {
  AAVE_SUBGRAPH_IDS,
  TRACKED_TOKEN_ADDRESSES
} from "../../config/constants.js";

const SECONDS_PER_YEAR = 31536000;

export async function fetchAaveYields(
  chain: "ethereum" | "polygon" | "arbitrum"
) {
  try {
    const subgraphId = AAVE_SUBGRAPH_IDS[chain]?.aave;
    if (!subgraphId) return [];

    const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${subgraphId}`;

    const query = `
      {
        markets(
          first: 200
          where: { isActive: true }
        ) {
          id
          inputToken {
            id
            symbol
          }
          rates {
            rate
            side
            type
          }
          totalValueLockedUSD
        }
      }
    `;

    const { data } = await axios.post(url, { query });

    if (data.errors) {
      console.error(`Graph Error [Aave ${chain}]:`, data.errors);
      return [];
    }

    const markets = data.data?.markets || [];

    const trackedAddresses = new Set(
      Object.values(TRACKED_TOKEN_ADDRESSES[chain])
        .filter((addr): addr is string => typeof addr === "string")
        .map((addr) => addr.toLowerCase())
    );

    const results = markets
      .filter((m: any) => {
        const tokenAddress = m.inputToken?.id?.toLowerCase();
        const tvl = Number(m.totalValueLockedUSD || 0);

        return (
          tokenAddress &&
          trackedAddresses.has(tokenAddress) &&
          tvl > 1000000 // TVL threshold
        );
      })
      .map((m: any) => {
        const tvl = Number(m.totalValueLockedUSD || 0);

        // Prefer variable supply rate
        let rateObj = m.rates?.find(
          (r: any) =>
            r.side === "LENDER" &&
            r.type === "VARIABLE"
        );

        // fallback to any lender rate
        if (!rateObj) {
          rateObj = m.rates?.find(
            (r: any) => r.side === "LENDER"
          );
        }

        // Subgraph returns percentage (e.g., 3.5). Convert to decimal (0.035).
        const rawRate = rateObj ? Number(rateObj.rate) : 0;
        const aprDecimal = rawRate / 100;

        // Convert APR → APY (Continuous per-second compounding)
        const apyDecimal = Math.pow(1 + (aprDecimal / SECONDS_PER_YEAR), SECONDS_PER_YEAR) - 1;

        return {
          protocol: "Aave V3",
          chain,
          asset: m.inputToken?.symbol,
          type: "lending",
          apy: Number((apyDecimal * 100).toFixed(2)),
          tvl: Math.round(tvl),
          poolAddress: m.id,
          lastUpdated: new Date().toISOString()
        };
      })
      .sort((a: any, b: any) => b.tvl - a.tvl);

    return results;

  } catch (error) {
    console.error(`Failed to fetch Aave yields for ${chain}:`, error);
    return [];
  }
}