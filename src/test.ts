import { fetchAaveYields } from "./indexers/aave/aave";
async function test() {
    const yields = await fetchAaveYields('ethereum');
    console.log(yields);
}

test();