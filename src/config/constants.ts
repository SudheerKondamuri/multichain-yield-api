const AAVE_SUBGRAPH_IDS = {
  ethereum: {
    aave: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk',
    uniswap: '4cKy6QQMc5tpfdx8yxfYeb9TLZmgLQe44ddW1G7NwkA6',
    curve: '3fy93eAT56UJsRCEht8iFhfi6wjHWXtZ9dnnbQmvFopF'
  },
  polygon: {
    aave: '6yuf1C49aWEscgk5n9D1DekeG1BCk5Z9imJYJT3sVmAT',
    uniswap: '3hCPRGf4z88VC5rsBKU5AA9FBBq5nF3jbKJG7VZCbhjm',
    curve: 'CS1erVSSAaw6aNZwERq7HwK4tsFQ7WcfPZdoM2rRB2uL'
  },
  arbitrum: {
    aave: '4xyasjQeREe7PxnF6wVdobZvCw5mhoHZq3T7guRpuNPf',
    uniswap: 'FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM',
    curve: '77mG1reS3799696mvFopF'
  }
};

const TRACKED_TOKENS = ['USDC', 'USDT', 'DAI', 'USDS', 'WETH', 'WBTC', 'stETH', 'cbETH', 'crvUSD', 'GHO'];

const CURVE_POOL_IDS = {
  ethereum: [
    "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7", // 3Pool (DAI/USDC/USDT)
    "0xdc24316b9ae028f1497c275eb9192a3ea0f67022"  // stETH/ETH
  ],
  polygon: [
    "0x445fe580ef8d70ff569ab36e80c647af338db351"  // aave (DAI/USDC/USDT)
  ],
  arbitrum: [
    "0x7f90122bf980008853d853c654262146305526e8", // 2Pool (USDC/USDT)
    "0x7b8a62f2468774e0d005b76543a70d4b71a2b92b"  // crvUSD/USDC
  ]
};
const UNISWAP_SUBGRAPH_IDS: Record<string, string> = {
  ethereum: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
  arbitrum: "FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM",
  polygon: "3hCPRGf4z88VC5rsBKU5AA9FBBq5nF3jbKJG7VZCbhjm"
};

const CURVE_SUBGRAPH_IDS: Record<string, string> = {
  ethereum: '3fy93eAT56UJsRCEht8iFhfi6wjHWXtZ9dnnbQmvFopF',
  polygon: 'CS1erVSSAaw6aNZwERq7HwK4tsFQ7WcfPZdoM2rRB2uL',
  arbitrum: 'Gv6NJRut2zrm79ef4QHyKAm41YHqaLF392sM3cz9wywc'
};

export { AAVE_SUBGRAPH_IDS, TRACKED_TOKENS, CURVE_POOL_IDS, UNISWAP_SUBGRAPH_IDS, CURVE_SUBGRAPH_IDS };