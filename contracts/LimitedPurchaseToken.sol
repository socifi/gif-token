pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/token/MintableToken.sol';


/**
 * @title Limited purchase token contract.
 * @author SOCIFI Ltd, 2017
 * @dev Adds ability to limit the amount of tokens available for purchase.
 */
contract LimitedPurchaseToken is MintableToken {

    // Supply of tokens available for purchase.
    uint256 public availableSupply = 0;

    // how many token units a buyer gets per wei
    uint256 public rate;

    // Total supply of tokens that can be minted.
    uint256 public maxSupply;

    /**
     * @dev Event for token purchase logging.
     * @param purchaser address Who paid for the tokens.
     * @param beneficiary address Who got the tokens.
     * @param value uint256 Weis paid for purchase.
     * @param amount uint256 Amount of tokens purchased.
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
     * @dev Event for token unfreeze logging.
     * @param amount uint256 Amount of unfreezed tokens.
     * @param totalAvailableSupply uint256 Total supply of tokens available for purchase.
     */
    event TokenUnfreeze(uint256 amount, uint256 totalAvailableSupply);

    /**
     * @dev Buy tokens in exchange for ETH in given rate. The amount of tokens may be limited by total number
     * of tokens currently available for purchase.
     * @param _beneficiary address Address to where the tokens shall be send to.
     */
    function buyTokens(address _beneficiary) public payable {
        require(_beneficiary != 0x0);
        require(msg.value != 0);

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(rate);

        require(tokens <= availableSupply);

        // mint tokens
        availableSupply = availableSupply.sub(tokens);
        totalSupply = totalSupply.add(tokens);
        balances[_beneficiary] = balances[_beneficiary].add(tokens);
        Mint(_beneficiary, tokens);
        Transfer(0x0, _beneficiary, tokens);

        TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);
    }

    /**
     * @dev Unfreeze n percent of unsold tokens.
     */
    function unfreeze(uint _percent) onlyOwner public {
        require(totalSupply < maxSupply);

        uint256 unfreezeAmount = maxSupply.sub(totalSupply).div(_percent);

        availableSupply = availableSupply.add(unfreezeAmount);

        TokenUnfreeze(unfreezeAmount, availableSupply);
    }
}
