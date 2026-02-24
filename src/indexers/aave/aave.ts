import axios from 'axios';
import { SUBGRAPH_IDS, TRACKED_TOKENS } from '../../config/constants.js';

export async function fetchAaveYields(chain: 'ethereum' | 'polygon' | 'arbitrum') {
  try {
    const url = `https://gateway.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/${SUBGRAPH_IDS[chain].aave}`;

    const query = `{
      markets(where: { isActive: true }, first: 100) {
        id
        inputToken {
          symbol
        }
        rates {
          rate
          side
          type
        }
        totalValueLockedUSD
      }
    }`;

    const { data } = await axios.post(url, { query });

    if (data.errors) {
      console.error(`Graph Error [Aave ${chain}]:`, data.errors);
      return [];
    }

    const markets = data.data?.markets || [];
    const filteredMarkets = markets.filter((m: any) =>
      TRACKED_TOKENS.includes(m.inputToken?.symbol)
    );

    return filteredMarkets.map((m: any) => {
      // Find the supplier APY. In Messari schema, side: "LENDER", type: "VARIABLE"
      const rateObj = m.rates?.find((r: any) => r.side === 'LENDER' && r.type === 'VARIABLE');
      const apy = rateObj ? Number(rateObj.rate) : 0;

      return {
        protocol: "Aave V3",
        chain,
        asset: m.inputToken?.symbol,
        type: "lending",
        apy,
        tvl: Number(m.totalValueLockedUSD || 0),
        poolAddress: m.id,
        lastUpdated: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error(`Failed to fetch Aave yields for ${chain}:`, error);
    return [];
  }
}