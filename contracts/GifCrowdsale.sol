pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/lifecycle/Pausable.sol';
import './GifToken.sol';


/**
 * @title Crowdsale contract for GIF Token.
 * @author SOCIFI Ltd, 2017
 * @dev This is the main contract for the SOCIFI ICO. This crowdsale contract initializes a new GIF Token (so this one
 * is the token contract owner), do the initial share distribution and handle the purchasing of the tokens.
 */
contract GifCrowdsale is Pausable {
    using SafeMath for uint256;

    // Addresses for the initial split
    address public socifiTeamAddress;
    address public socifiOpsAddress;
    address public gifFoundationAddress;

    // GIF Token instance
    GifToken public token;

    // start and end timestamps where investments are allowed (both inclusive)
    uint256 public startTime;
    uint256 public endTime;

    // address where funds are collected
    address public wallet;

    // conversion rate between GIF Tokens and Ethereum
    uint256 public constant rate = 5000;

    // amount of raised money in wei
    uint256 public weiRaised;

    // No. of decimal units in GIF Token
    uint256 public constant decimals = 18;

    /**
     * @dev Event for token purchase logging.
     * @param purchaser address Who paid for the tokens.
     * @param beneficiary address Who got the tokens.
     * @param value uint256 Weis paid for purchase.
     * @param amount uint256 Amount of tokens purchased.
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
     * @dev Initializes the crowdsale, creates the token and does basic checks of input parameters.
     * @param _socifi address Address of the SOCIFI Team for initial split.
     * @param _socifiOps address Address of the SOCIFI Ops for initial split.
     * @param _gifFoundation address Address of the GIF Foundation for initial split.
     * @param _startTime uint ICO start time.
     * @param _endTime uint ICO end time.
     * @param _transferableAfterTime uint When the token is unfreezed for transfer.
     * @param _wallet address Address of the wallet to which all the invested funds will be transferred.
     */
    function GifCrowdsale(
        address _socifi,
        address _socifiOps,
        address _gifFoundation,
        uint _startTime,
        uint _endTime,
        uint _transferableAfterTime,
        address _wallet
    ) Ownable() public
    {
        require(_socifi != address(0));
        require(_socifiOps != address(0));
        require(_gifFoundation != address(0));
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_wallet != address(0));

        socifiTeamAddress = _socifi;
        socifiOpsAddress = _socifiOps;
        gifFoundationAddress = _gifFoundation;
        wallet = _wallet;

        startTime = _startTime;
        endTime = _endTime;

        token = new GifToken(endTime, _transferableAfterTime, wallet, rate);

        doPreallocatedSplit();
    }

    // fallback function can be used to buy tokens
    function () public payable {
        buyTokens(msg.sender);
    }

    /**
     * @dev This mint the tokens based on the amount provided and optional bonuses given. The ETH is forwarded to the
     * wallet.
     * @param _beneficiary address Address to where the tokens shall be send to.
     */
    function buyTokens(address _beneficiary) public whenNotPaused payable {
        require(_beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(rate);

        uint256 dateBonusPercent = dateBonus(now);
        uint256 quantityBonusPercent = quantityBonus(weiAmount);
        uint256 totalBonusPercent = dateBonusPercent + quantityBonusPercent;

        if (totalBonusPercent > 0) {
            uint256 bonusTokens = tokens.div(100).mul(totalBonusPercent);
            tokens = tokens.add(bonusTokens);
        }

        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.mint(_beneficiary, tokens);
        TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

        forwardFunds();
    }

    /**
     * @dev Allows the current owner to transfer control of the token to a newOwner.
     * @param _newOwner address The address to transfer ownership to.
     */
    function transferTokenOwnership(address _newOwner) onlyOwner public {
        token.transferOwnership(_newOwner);
    }

    /**
     * @dev Mint tokens in given amount and assign them to given address. Be aware of max supply of tokens.
     * @param _to address The address that will receive the minted tokens.
     * @param _amount uint256 The amount of tokens to mint.
     * @return bool A boolean that indicates if the operation was successful.
     */
    function mintTokens(address _to, uint256 _amount) onlyOwner public returns (bool) {
        require(now <= endTime);

        return token.mint(_to, _amount);
    }

    /**
     * @return bool true if crowdsale event has ended
     */
    function hasEnded() public constant returns (bool) {
        return now > endTime;
    }

    /**
     * @dev Distribute preallocated tokens between SOCIFI Team, SOCIFI Ops and GIF Foundation.
     * The split amounts are defined as a percentages from total supply of the tokens.
     */
    function doPreallocatedSplit() internal {
        uint256 maxSupply = token.maxSupply();
        token.mint(socifiTeamAddress, maxSupply.div(100).mul(6));
        token.mint(socifiOpsAddress, maxSupply.div(100).mul(11));
        token.mint(gifFoundationAddress, maxSupply.div(100).mul(22));
    }

    /**
     * @dev Get the total bonus amount based on date.
     * @param _time uint Time for which to calculate the bonus.
     * @return uint256 Date bonus percentage.
     */
    function dateBonus(uint _time) view internal returns (uint256) {
        uint timeFromStart = _time - startTime;

        if (timeFromStart <= 2 days) return 35;
        if (timeFromStart <= 5 days) return 20;
        if (timeFromStart <= 10 days) return 15;
        if (timeFromStart <= 14 days) return 10;
        if (timeFromStart <= 18 days) return 6;
        if (timeFromStart <= 21 days) return 3;

        return 0;
    }

    /**
     * @dev Get the total bonus amount based on amount.
     * @param _weiAmount uint256 Amount in wei.
     * @return uint256 Quantity bonus percentage.
     */
    function quantityBonus(uint256 _weiAmount) pure internal returns (uint256) {
        if (_weiAmount >= 100 * (10 ** decimals)) return 7;
        if (_weiAmount >= 50 * (10 ** decimals)) return 3;
        if (_weiAmount >= 10 * (10 ** decimals)) return 1;

        return 0;
    }

    /**
     * send ether to the fund collection wallet
     * override to create custom fund forwarding mechanisms
     */
    function forwardFunds() internal {
        wallet.transfer(msg.value);
    }

    /**
     * @return bool true if the transaction can buy tokens
     */
    function validPurchase() internal constant returns (bool) {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        return withinPeriod && nonZeroPurchase;
    }
}
