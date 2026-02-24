import { redisClient } from './utils/redisClient.js';
import { fetchAaveYields } from './indexers/aave/aave.js';
import { fetchCurveYields } from './indexers/curve/curve.js';
import fs from 'fs';
import path from 'path';
import { fetchUniswapYields } from './indexers/uniswap/uniswap.js';

const chains: ('ethereum' | 'polygon' | 'arbitrum')[] = ['ethereum', 'polygon', 'arbitrum'];

async function syncData() {
    console.log(`\n🔄 [${new Date().toISOString()}] Starting Data Sync...`);

    // snapshot will store everything for the JSON backup
    const snapshot: any = {};

    for (const chain of chains) {
        try {
            snapshot[chain] = { lastSync: new Date().toISOString() };

            // 1. Fetch from all indexers in parallel
            const [aaveYields, curveYields, uniswapYields] = await Promise.all([
                fetchAaveYields(chain),
                fetchCurveYields(chain),
                fetchUniswapYields(chain)
            ]);

            // 2. Prepare aggregated data for Redis
            // We label them clearly so the frontend can filter by protocol
            const updatedChainData = [
                ...aaveYields.map((y: any) => ({ ...y, protocol: 'Aave V3' })),
                ...curveYields.map((y: any) => ({ ...y, protocol: 'Curve' })),
                ...uniswapYields.map((y: any) => ({ ...y, protocol: 'Uniswap V3' }))
            ];

            // 3. Set to Redis (5-minute expiry)
            await redisClient.setEx(`yields:${chain}`, 300, JSON.stringify(updatedChainData));

            // 4. Update snapshot for the local file
            snapshot[chain]['aave-v3'] = aaveYields;
            snapshot[chain]['curve'] = curveYields;
            snapshot[chain]['uniswap-v3'] = uniswapYields;

            console.log(`✅ ${chain.toUpperCase()}: Synced ${aaveYields.length} Aave & ${curveYields.length} Curve & ${uniswapYields.length} Uniswap pools`);

        } catch (error) {
            console.error(`❌ Sync Failed for ${chain}:`, error);
        }
    }

    // 5. Write to persistent backup file
    try {
        const backupPath = path.resolve(process.cwd(), 'data', 'yields_cache.json');
        if (!fs.existsSync(path.dirname(backupPath))) {
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        }
        fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
        console.log(`💾 Snapshot saved to ./data/yields_cache.json`);
    } catch (err) {
        console.error("Failed to write persistent backup snapshot", err);
    }
}

async function startWorker() {
    await syncData();
    setInterval(syncData, 5 * 60 * 1000);
}

startWorker().catch(console.error);