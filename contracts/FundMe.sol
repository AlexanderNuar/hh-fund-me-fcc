// Get Funds From Users
// Withdraw funds
// Set minimum funding value in USD

//SPDX-License-Identifier: MIT
//Pragma
pragma solidity ^0.8.7;
// imports
import "./PriceConverter.sol";
// error codes
error FundMe__NotOwner();

// interfaces, librarys, contracts

contract FundMe {
    // type declarations

    using PriceConverter for uint256;

    // state variables

    uint256 public constant MINIMUM_USD = 50 * 1e18; // 1 * 10 **18
    // 307 - constant
    // 2451 - without constant

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    address public immutable i_owner;
    AggregatorV3Interface public priceFeed;

    //modifiers

    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        ); // 1e18 == 1 * 10 ** 18 == 1000000000000000000
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex = funderIndex + 1
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);

        // call (forward all gas or set gas, returns bool)

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call Failed");
    }

    // What happens if someone sends this contract ETH without calling the fund function?
}
