// import { redisClient } from './utils/redisClient.js';
// import { getAaveData } from './indexers/aave/aave.js';

// async function startSync() {
//     console.log("🔄 Starting DeFi Sync Worker...");

//     setInterval(async () => {
//         try {
//             const data = await getAaveData();
            
//             // Save to Redis so the API can see it
//             await redisClient.set('yield:aave:usdc', JSON.stringify(data));
            
//             console.log(`✅ Synced Aave USDC: ${data.apy} (Index: ${data.floorIndex})`);
//         } catch (error) {
//             console.error("❌ Sync Failed:", error);
//         }
//     }, 300000); // Every 5 minutes
// }

// startSync();