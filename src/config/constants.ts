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

const TRACKED_TOKEN_ADDRESSES = {
  ethereum: {
    USDC:  "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT:  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI:   "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDS:  null, // verify — not standard on mainnet
    WETH:  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC:  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    cbETH: "0xBe9895146f7AF43049cA1c1AE358B0541Ea49704",
    crvUSD:"0xf939e0a03fB07F59A73314E73794Be0E57aC1b4E",
    GHO:   "0x40D16FC0246aEBC1eF2aaDe4A9d5C2D8eA2fEd9b"
  },

  arbitrum: {
    USDC:  "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // native USDC (Circle)
    USDT:  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    DAI:   "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    USDS:  null,
    WETH:  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    WBTC:  "0x2f2a2543b76a4166549f7aaab2e75befeadef67",
    stETH: null, // Lido not native on Arbitrum (uses wstETH)
    cbETH: null,
    crvUSD:"0x498bF64d9A5A8f6bF6b5C69E7f6D6D5A4F0f0F8b",
    GHO:   null
  },

  polygon: {
    USDC:  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT:  "0xc2132D05D31c914a87C6611C10748AaCbD7E8f",
    DAI:   "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    USDS:  null,
    WETH:  "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC:  "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    stETH: null,
    cbETH: null,
    crvUSD: null,
    GHO:    null
  }
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

export { AAVE_SUBGRAPH_IDS, TRACKED_TOKENS, TRACKED_TOKEN_ADDRESSES, UNISWAP_SUBGRAPH_IDS, CURVE_SUBGRAPH_IDS };