const networkConfig = {
  11155111: {
    name: 'sepolia',
    ethUsdPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  },
  137: {
    name: 'polygon',
    ethUsdPriceFeed: '0x67935f65D1577ced9f4929D3679A157E95C1c02c',
  },
}

const developmentChains = ['hardhat', 'lockalhost']
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
}
