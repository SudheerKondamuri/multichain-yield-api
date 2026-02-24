import axios from 'axios';
import { CURVE_SUBGRAPH_IDS, CURVE_POOL_IDS } from '../../config/constants.js';

export async function fetchCurveYields(chain: 'ethereum' | 'polygon' | 'arbitrum') {
    const subgraphId = CURVE_SUBGRAPH_IDS[chain];
    if (!subgraphId) return [];

    const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${subgraphId}`;

    // Get the explicit list of pool addresses we want for this chain
    const targetPools = CURVE_POOL_IDS[chain] || [];
    if (targetPools.length === 0) return [];

    // The Graph requires double quotes for strings in the id_in array
    const poolIdsString = `[${targetPools.map(id => `"${id.toLowerCase()}"`).join(', ')}]`;

    const query = `
    {
      liquidityPools(where: { id_in: ${poolIdsString} }) {
        id
        symbol
        inputTokens { symbol }
        totalValueLockedUSD
        dailySnapshots(first: 1, orderBy: timestamp, orderDirection: desc) {
          dailyVolumeUSD
        }
      }
    }
    `;

    try {
        const response = await axios.post(url, { query });

        if (response.data.errors) {
            console.error(`Graph Error [Curve ${chain}]:`, response.data.errors);
            return [];
        }

        const pools = response.data?.data?.liquidityPools || [];

        return pools
            .map((pool: any) => {
                const tvl = parseFloat(pool.totalValueLockedUSD || "0");
                const volume24h = parseFloat(pool.dailySnapshots?.[0]?.dailyVolumeUSD || "0");

                // Estimate APY based on volume. Curve V1 pools typically have 0.04% fee.
                // APY = (Daily Volume * 0.0004 * 365) / TVL * 100
                const feeFactor = 0.0004;
                const apy = tvl > 0 ? ((volume24h * feeFactor * 365) / tvl) * 100 : 0;

                const tokens = pool.inputTokens?.map((t: any) => t.symbol) || [];

                return {
                    protocol: "Curve",
                    chain,
                    asset: pool.symbol.replace('-f', ''), // Simplify symbol Name
                    apy: Number(apy.toFixed(2)),
                    tvl: Math.round(tvl),
                    tokens,
                    poolAddress: pool.id,
                    lastUpdated: new Date().toISOString()
                };
            })
            .sort((a: any, b: any) => b.tvl - a.tvl); // Sort by highest TVL

    } catch (error) {
        console.error(`[Curve Indexer Error] ${chain}:`, error);
        return [];
    }
}