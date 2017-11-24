pragma solidity ^0.4.11;


import './TimeScheduledToken.sol';
import './LimitedPurchaseToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';


/**
 * @title Crowdsale contract for GIF Token.
 * @author SOCIFI Ltd, 2017
 * @dev An ERC20 mintable token with total supply limited to 500,000,000,000 GIF Tokens. The initial supply is 0 so we
 * can take advantage of the `mint` function. Also, it is easier to mint new tokens instead of dealing with transferring
 * tokens from the owner's address.
 */
contract GifToken is LimitedPurchaseToken, TimeScheduledToken {
    using SafeMath for uint256;

    string public constant name = "GIF Token";
    string public constant symbol = "GIF";
    uint256 public constant decimals = 18;

    // address where funds are collected
    address public wallet;

    /**
     * @dev Initialize the token.
     * @param _purchasableAfterTime uint256 After what time the token is purchasable.
     * @param _transferableAfterTime uint256 After what time the token is transferable.
     * @param _wallet address Address of the wallet to which all the invested funds will be transferred.
     * @param _rate uint256 Conversion rate between GIF Tokens and Ethereum.
     */
    function GifToken(uint256 _purchasableAfterTime, uint256 _transferableAfterTime, address _wallet, uint256 _rate)
        TimeScheduledToken(_purchasableAfterTime, _transferableAfterTime) public {
        require(_rate > 0);
        wallet = _wallet;
        rate = _rate;
        maxSupply = 5000000000 * (10 ** decimals);
    }

    // fallback function can be used to buy tokens
    function () payable public {
        buyTokens(msg.sender);
    }

    /**
     * @dev This mint the tokens based on the amount provided and optional bonuses given. The ETH is forwarded to the
     * wallet.
     * @param _beneficiary address Address to where the tokens shall be send to.
     */
    function buyTokens(address _beneficiary) public whenPurchasable payable {
        super.buyTokens(_beneficiary);

        forwardFunds();
    }

    /**
     * @dev Mint tokens in given amount and assign them to given address. Be aware of max supply of tokens.
     * @param _to address The address that will receive the minted tokens.
     * @param _amount uint256 The amount of tokens to mint.
     * @return bool A boolean that indicates if the operation was successful.
     */
    function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
        require(totalSupply.add(_amount) <= maxSupply);

        return super.mint(_to, _amount);
    }

    /**
     * @dev Transfer tokens from sender to another.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 the amount of tokens to be transferred.
     * @return A boolean that indicates if the operation was successful.
     */
    function transfer(address _to, uint256 _value) public whenTransferable returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @return bool A boolean that indicates if the operation was successful.
     */
    function transferFrom(address _from, address _to, uint256 _value) public whenTransferable returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev send ether to the fund collection wallet
     */
    function forwardFunds() internal {
        wallet.transfer(msg.value);
    }
}
