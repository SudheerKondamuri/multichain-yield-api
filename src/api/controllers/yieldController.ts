import { Request, Response } from 'express';
import { redisClient } from '../../utils/redisClient.js';

export const getAggregatedYields = async (req: Request, res: Response): Promise<void> => {
    try {
        const chain = req.query.chains as string;
        const minapy = req.query.minAPY as string;

        let targetChains = ['ethereum', 'polygon', 'arbitrum'];
        if (chain) {
            targetChains = chain.split(',').map(c => c.trim().toLowerCase());
        }

        let allOpportunities: any[] = [];

        for (const chain of targetChains) {
            const dataStr = await redisClient.get(`yields:${chain}`);
            if (dataStr) {
                const parsed = JSON.parse(dataStr);
                allOpportunities = allOpportunities.concat(parsed);
            }
        }

        if (minapy && !isNaN(Number(minapy))) {
            const minAPY = Number(minapy);
            allOpportunities = allOpportunities.filter(opp=> opp.apy >= minAPY);
        }

        res.status(200).json({ opportunities: allOpportunities });
    } catch (error) {
        console.error("Error in getAggregatedYields:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
        const statusObj: any = {};
        const chains = ['ethereum', 'polygon', 'arbitrum'];

        for (const chain of chains) {
            const dataStr = await redisClient.get(`yields:${chain}`);
            if (dataStr) {
                const parsed = JSON.parse(dataStr);
                let lastSync = new Date(0);
                parsed.forEach((p: any) => {
                    const lu = new Date(p.lastUpdated);
                    if (lu > lastSync) lastSync = lu;
                });
                statusObj[chain] = {
                    lastSync: lastSync.toISOString(),
                    status: "ok"
                };
            } else {
                statusObj[chain] = {
                    lastSync: null,
                    status: "stale_or_missing"
                };
            }
        }
        res.status(200).json(statusObj);

    } catch (error) {
        console.error("Error in getStatus:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const SUPPORTED_CHAINS = ["ethereum", "arbitrum", "polygon"];

export const getBestYield = async (req: Request, res: Response): Promise<void> => {
  try {
    // Determine which chains to query based on the request URL, defaulting to all
    const reqChain = req.query.chain as string;
    const chainsToFetch = reqChain && SUPPORTED_CHAINS.includes(reqChain.toLowerCase()) 
      ? [reqChain.toLowerCase()] 
      : SUPPORTED_CHAINS;

    // Fetch all relevant Redis keys in parallel
    const redisKeys = chainsToFetch.map(chain => `yields:${chain}`);
    const rawDataArray = await redisClient.mGet(redisKeys);

    let allOpportunities: any[] = [];

    // Safely parse each returned key, ignoring nulls from failed syncs
    rawDataArray.forEach((rawData) => {
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed)) {
            allOpportunities.push(...parsed);
          }
        } catch (parseError) {
          console.error("Failed to parse Redis yield data:", parseError);
        }
      }
    });

    if (allOpportunities.length === 0) {
      res.status(404).json({ error: "Yield data is currently empty or syncing." });
      return;
    }

    // Apply strict safety threshold: Minimum $1,000,000 TVL to filter out low-liquidity traps
    let filteredOpportunities = allOpportunities.filter((pool: any) => pool.tvl >= 1000000);

    // Apply optional protocol filter from query parameters
    const reqProtocol = req.query.protocol as string;
    if (reqProtocol) {
      filteredOpportunities = filteredOpportunities.filter((pool: any) => 
        pool.protocol && pool.protocol.toLowerCase().includes(reqProtocol.toLowerCase())
      );
    }

    if (filteredOpportunities.length === 0) {
      res.status(404).json({ error: "No credible pools matched your criteria." });
      return;
    }

    // Sort descending by APY and extract the absolute best one
    const bestYield = filteredOpportunities.sort((a: any, b: any) => b.apy - a.apy)[0];

    res.status(200).json(bestYield);
  } catch (error) {
    console.error("Error fetching best yield:", error);
    res.status(500).json({ error: "Internal server error while processing yield data." });
  }
};