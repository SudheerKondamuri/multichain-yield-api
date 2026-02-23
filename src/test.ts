import { fetchAaveYields, SupportedChain } from "./indexers/aave/aave";
async function test() {
    const chains: SupportedChain[] = ['ethereum', 'polygon', 'arbitrum'];
    for (const chain of chains) {
        const yields = await fetchAaveYields(chain);
        console.log(`Aave V3 Yields on ${chain}:`, yields);
    }
}

test();