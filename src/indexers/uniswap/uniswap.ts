import axios from 'axios';
import { SUBGRAPH_IDS } from '../constants/subgraphs.js';

export async function fetchUniswapYields(chain: 'ethereum' | 'polygon' | 'arbitrum') {
    try {
        const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${SUBGRAPH_IDS[chain].uniswap}`;

        const query = `{
      pools(orderBy: totalValueLockedUSD, orderDirection: desc, first: 20) {
        id
        token0 { symbol }
        token1 { symbol }
        totalValueLockedUSD
        poolDayData(first: 1, orderBy: date, orderDirection: desc) {
          feesUSD
        }
      }
    }`;

        const { data } = await axios.post(url, { query });

        if (data.errors) {
            console.error(`Graph Error [Uniswap ${chain}]:`, data.errors);
            return [];
        }

        return (data.data?.pools || []).map((p: any) => {
            const dailyFees = p.poolDayData?.[0]?.feesUSD || 0;
            const tvl = Number(p.totalValueLockedUSD || 0);
            // Estimated APY: (Daily Fees * 365 / TVL) * 100
            const apy = tvl > 0 ? (Number(dailyFees) * 365 / tvl) * 100 : 0;

            return {
                protocol: "Uniswap V3",
                chain,
                asset: `${p.token0.symbol}-${p.token1.symbol}`,
                type: "lp",
                apy: apy,
                tvl: tvl,
                poolAddress: p.id,
                lastUpdated: new Date().toISOString()
            };
        });
    } catch (error) {
        console.error(`Failed to fetch Uniswap yields for ${chain}:`, error);
        return [];
    }
}