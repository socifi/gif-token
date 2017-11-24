pragma solidity ^0.4.11;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/GifCrowdsale.sol";


contract TestGifCrowdsale is GifCrowdsale {

    uint256 public constant digits = 1000000000000000000;

    function TestGifCrowdsale()
        GifCrowdsale(address(1), address(1), address(1), now, now + 30 days, now + 37 days, address(1)) public {
    }

    function testDateBonus() public {
        uint256 time = startTime = now;

        Assert.equal(dateBonus(time), uint(35), 'Date bonus for 1st second must be 35%.');
        Assert.equal(dateBonus(time + 2 days), uint(35), 'Date bonus for 2nd day must be 35%.');
        Assert.equal(dateBonus(time + 2 days + 1 seconds), uint(20), 'Date bonus for 2nd day 1st second must be 20%.');
        Assert.equal(dateBonus(time + 5 days), uint(20), 'Date bonus for 5th day must be 20%.');
        Assert.equal(dateBonus(time + 5 days + 1 seconds), uint(15), 'Date bonus for 5th day 1st second must be 15%.');
        Assert.equal(dateBonus(time + 10 days), uint(15), 'Date bonus for 10th day must be 15%.');
        Assert.equal(dateBonus(time + 10 days + 1 seconds), uint(10), 'Date bonus for 10th day 1st second must be 10%.');
        Assert.equal(dateBonus(time + 14 days), uint(10), 'Date bonus for 14th day must be 10%.');
        Assert.equal(dateBonus(time + 14 days + 1 seconds), uint(6),  'Date bonus for 14th day 1st second must be 6%.');
        Assert.equal(dateBonus(time + 18 days), uint(6),  'Date bonus for 18th day must be 6%.');
        Assert.equal(dateBonus(time + 18 days + 1 seconds), uint(3),  'Date bonus for 18th day 1st second must be 3%.');
        Assert.equal(dateBonus(time + 21 days), uint(3),  'Date bonus for 21st day must be 3%.');
        Assert.equal(dateBonus(time + 21 days + 1 seconds), uint(0),  'Date bonus for 21st day 1st second must be 0%.');
        Assert.equal(dateBonus(time + 30 days), uint(0),  'Date bonus for 30th day must be 0%.');
    }

    function testQuantityBonus() public {
        Assert.equal(quantityBonus(0 * digits), uint(0), 'Bonus for 0 ETH must be 0%');
        Assert.equal(quantityBonus(9 * digits), uint(0), 'Bonus for 9 ETH must be 0%');
        Assert.equal(quantityBonus(10 * digits), uint(1), 'Bonus for 10 ETH must be 1%');
        Assert.equal(quantityBonus(49 * digits), uint(1), 'Bonus for 49 ETH must be 1%');
        Assert.equal(quantityBonus(50 * digits), uint(3), 'Bonus for 50 ETH must be 3%');
        Assert.equal(quantityBonus(99 * digits), uint(3), 'Bonus for 99 ETH must be 3%');
        Assert.equal(quantityBonus(100 * digits), uint(7), 'Bonus for 100 ETH must be 7%');
        Assert.equal(quantityBonus(1000 * digits), uint(7), 'Bonus for 1000 ETH must be 7%');
    }
}
