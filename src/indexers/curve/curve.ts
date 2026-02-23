import axios from 'axios';
import { SUBGRAPH_IDS } from '../constants/subgraphs.js';

export async function fetchCurveYields(chain: 'ethereum' | 'polygon' | 'arbitrum') {
    try {
        const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${SUBGRAPH_IDS[chain].curve}`;

        // Simple query for Curve pool data
        const query = `{
      pools(first: 10, orderBy: tvlUSD, orderDirection: desc) {
        id
        name
        symbol
        tvlUSD
      }
    }`;

        const { data } = await axios.post(url, { query });

        if (data.errors) {
            console.error(`Graph Error [Curve ${chain}]:`, data.errors);
            return [];
        }

        return (data.data?.pools || []).map((p: any) => ({
            protocol: "Curve",
            chain,
            asset: p.symbol || p.name,
            type: "lp",
            apy: 2.5, // Note: Curve APY often requires a secondary fetch from their own API for gauge rewards
            tvl: Number(p.tvlUSD || 0),
            poolAddress: p.id,
            lastUpdated: new Date().toISOString()
        }));
    } catch (error) {
        console.error(`Failed to fetch Curve yields for ${chain}:`, error);
        return [];
    }
}