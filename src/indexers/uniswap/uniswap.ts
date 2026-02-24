import axios from 'axios';
import { UNISWAP_SUBGRAPH_IDS } from '../../config/constants';


const TRACKED_TOKENS = ['USDC', 'USDT', 'DAI', 'WBTC', 'WETH'];

export async function fetchUniswapYields(chain: 'ethereum' | 'arbitrum' | 'polygon') {
    const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${UNISWAP_SUBGRAPH_IDS[chain]}`;
    if (!url) return [];

    // Query 20 pools, but only those with >$500k TVL to ignore "zombie" pools
    const query = `
    {
      pools(first: 20, orderBy: totalValueLockedUSD, orderDirection: desc, where: { totalValueLockedUSD_gt: "500000" }) {
        id
        token0 { symbol }
        token1 { symbol }
        feeTier
        totalValueLockedUSD
        poolDayData(first: 1, orderBy: date, orderDirection: desc) {
          volumeUSD
        }
      }
    }
    `;

    try {
        const response = await axios.post(url, { query });
        const pools = response.data?.data?.pools || [];

        return pools
            .filter((pool: any) => 
                TRACKED_TOKENS.includes(pool.token0.symbol) || 
                TRACKED_TOKENS.includes(pool.token1.symbol)
            )
            .map((pool: any) => {
                const tvl = parseFloat(pool.totalValueLockedUSD);
                const volume24h = parseFloat(pool.poolDayData[0]?.volumeUSD || "0");
                const feeFactor = parseFloat(pool.feeTier) / 1000000; // e.g., 3000 -> 0.003 (0.3%)

                // Calculate APY based on fees collected vs capital locked
                const apy = tvl > 0 ? ((volume24h * feeFactor * 365) / tvl) * 100 : 0;

                return {
                    protocol: "Uniswap V3",
                    chain,
                    asset: `${pool.token0.symbol}/${pool.token1.symbol}`,
                    apy: Number(apy.toFixed(2)),
                    tvl: Math.round(tvl),
                    poolAddress: pool.id,
                    feeTier: `${parseFloat(pool.feeTier) / 10000}%`,
                    lastUpdated: new Date().toISOString()
                };
            });
    } catch (error) {
        console.error(`Uniswap Indexer Error [${chain}]:`, error);
        return [];
    }
}