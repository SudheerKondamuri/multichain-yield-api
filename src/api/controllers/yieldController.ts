import { Request, Response } from 'express';
import { redisClient } from '../../utils/redisClient.js';

export const getAggregatedYields = async (req: Request, res: Response): Promise<void> => {
    try {
        const chainsQuery = req.query.chains as string;
        const minAPYQuery = req.query.minAPY as string;

        let targetChains = ['ethereum', 'polygon', 'arbitrum'];
        if (chainsQuery) {
            targetChains = chainsQuery.split(',').map(c => c.trim().toLowerCase());
        }

        let allOpportunities: any[] = [];

        for (const chain of targetChains) {
            const dataStr = await redisClient.get(`yields:${chain}`);
            if (dataStr) {
                const parsed = JSON.parse(dataStr);
                allOpportunities = allOpportunities.concat(parsed);
            }
        }

        if (minAPYQuery && !isNaN(Number(minAPYQuery))) {
            const minAPY = Number(minAPYQuery);
            allOpportunities = allOpportunities.filter(opp => opp.apy >= minAPY);
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
