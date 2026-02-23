import { redisClient } from './utils/redisClient.js';
import { fetchAaveYields } from './indexers/aave/aave.js';
import fs from 'fs';
import path from 'path';

const chains: ('ethereum' | 'polygon' | 'arbitrum')[] = ['ethereum', 'polygon', 'arbitrum'];

async function syncData() {
    console.log(`\n🔄 [${new Date().toISOString()}] Starting Data Sync...`);

    // We will build an aggregated structure for the JSON file
    const snapshot: any = {
        ethereum: { 'aave-v3': [], 'lastSync': '' },
        polygon: { 'aave-v3': [], 'lastSync': '' },
        arbitrum: { 'aave-v3': [], 'lastSync': '' }
    };

    for (const chain of chains) {
        try {
            // 1. Fetch from Aave indexer
            const aaveYields = await fetchAaveYields(chain);

            // 2. Fetch existing Redis data to not overwrite other protocols (though right now it's only Aave)
            const existingChainDataStr = await redisClient.get(`yields:${chain}`);
            const chainData: any[] = existingChainDataStr ? JSON.parse(existingChainDataStr) : [];

            // 3. Remove old Aave data from array, and merge in the newly fetched Aave data
            const otherProtocols = chainData.filter((item: any) => item.protocol !== 'Aave V3');
            const updatedChainData = [...otherProtocols, ...aaveYields];

            // 4. Set to Redis with TTL 300s (5 minutes)
            await redisClient.setEx(`yields:${chain}`, 300, JSON.stringify(updatedChainData));

            console.log(`✅ Synced ${aaveYields.length} Aave pools for ${chain}`);

            // 5. Update local snapshot object
            snapshot[chain]['aave-v3'] = aaveYields;
            snapshot[chain].lastSync = new Date().toISOString();

        } catch (error) {
            console.error(`❌ Sync Failed for ${chain}:`, error);
        }
    }

    // 6. Write to persistent backup file
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
    // Initial fetch
    await syncData();
    // Schedule every 5 minutes (300,000 milliseconds)
    setInterval(syncData, 5 * 60 * 1000);
}

// Ensure redis client connects successfully
// Since redisClient connects synchronously if 'await redisClient.connect()' is used in its file, 
// we just call startWorker here.
startWorker().catch(console.error);