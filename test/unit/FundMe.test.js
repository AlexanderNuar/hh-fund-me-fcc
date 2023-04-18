const { assert, expect } = require('chai')
const { network, deployments, ethers } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')

describe('FundMe', function () {
  let fundMe
  let mockV3Aggregator
  let deployer
  const sendValue = ethers.utils.parseEther('1') // 1eth

  beforeEach(async () => {
    // const accounts = await ethers.getSigners()
    // deployer = accounts[0]
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(['all'])
    fundMe = await ethers.getContract('FundMe', deployer)
    mockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer)
  })

  describe('constructor', function () {
    it('sets the aggreagator addresses correctly', async function () {
      const response = await fundMe.priceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe('fund', function () {
    it('fails if u dont send enough eth!', async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough")
    })
    it('updated the amount funded data structure', async function () {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.addressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })
    it('adds funder to array of funders', async function () {
      await fundMe.fund({ value: sendValue })
      const funder = await fundMe.funders(0)
      assert.equal(funder, deployer)
    })
  })
  describe('withdraw', function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue })
    })
    it('withdraw eth from a single founder', async function () {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )

      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
      // Act

      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt

      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // Assert

      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
    it('allows us to withdraw with multiple funders', async function () {
      // Arrange
      const accounts = await ethers.getSigners()
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i])
        await fundMeConnectedContract.fund({ value: sendValue })
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )

      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
      // Act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait(1)
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // Assert

      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )

      // Make shure that the funders are reset properly

      await expect(fundMe.funders(0)).to.be.reverted

      for (let i = 1; i < 6; i++) {
        assert.equal(await fundMe.addressToAmountFunded(accounts[i].address), 0)
      }
    })

    it('only allows the owner to withdraw', async function () {
      const accounts = await ethers.getSigners()
      const attacker = accounts[1]
      const attackerConnetcedContract = await fundMe.connect(attacker)
      await expect(attackerConnetcedContract.withdraw()).to.be.revertedWith(
        'FundMe__NotOwner'
      )
    })
  })
})
