// function deployFunc() {
//   console.log('hi!')
// }

// const { networks } = require('../hardhat.config')
require('dotenv').config()
const { network } = require('hardhat')
const { networkConfig, developmentChains } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')

// module.exports.default = deployFunc

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  // when going for localhot or hardhat we want to use a mock

  // const ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed']

  let ethUsdPriceFeedAddress

  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get('MockV3Aggregator')
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed']
  }

  const args = [ethUsdPriceFeedAddress]

  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: args, // put price feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  log('------------------------------------------------------')

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args)
  }
}

module.exports.tags = ['all', 'fundme']
