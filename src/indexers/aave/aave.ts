import axios from 'axios';
import { SUBGRAPH_IDS, TRACKED_TOKENS } from '../constants/subgraphs.js';

export async function fetchAaveYields(chain: 'ethereum' | 'polygon' | 'arbitrum') {
  try {
    const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${SUBGRAPH_IDS[chain].aave}`;

    const query = `{
      reserves(where: { symbol_in: ${JSON.stringify(TRACKED_TOKENS)}, isActive: true }) {
        symbol
        liquidityRate
        totalLiquidityUSD
        aToken { id }
      }
    }`;

    const { data } = await axios.post(url, { query });

    if (data.errors) {
      console.error(`Graph Error [Aave ${chain}]:`, data.errors);
      return [];
    }

    return (data.data?.reserves || []).map((r: any) => ({
      protocol: "Aave V3",
      chain,
      asset: r.symbol,
      type: "lending",
      apy: (Number(r.liquidityRate) / 1e27) * 100, // Ray to %
      tvl: Number(r.totalLiquidityUSD || 0),
      poolAddress: r.aToken.id,
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Failed to fetch Aave yields for ${chain}:`, error);
    return [];
  }
}