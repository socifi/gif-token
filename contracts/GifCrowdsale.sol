pragma solidity ^0.4.18;


import "./GifToken.sol";
import "./vesting/PreSaleVesting.sol";
import "./vesting/ThreeTimeVesting.sol";
import "./vesting/FourTimeVesting.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title GIF Crowdsale
 * @author SOCIFI Ltd, 2018
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * The process of issuing tokens is done by server application. Investors can not
 * send ETH directly. They need to use one of the deposit wallets provided in KYC portal.
 */
contract GifCrowdsale is Ownable {
    using SafeMath for uint256;

    GifToken public token;
    PreSaleVesting public preSaleVesting;
    ThreeTimeVesting public threeTimeVesting;
    FourTimeVesting public fourTimeVesting;

    // how many token units a buyer gets per wei
    uint256 public rate;

    uint256 public startTime;
    uint256 public endTime;

    uint256 public weiRaised;
    uint256 public preSaleTokensSold;
    uint256 public crowdsaleTokensSold;

    uint256 private constant DECIMALS = 18;
    uint256 private constant PRE_SALE_CAP = 842238054 * (10 ** DECIMALS);
    uint256 private constant CROWDSALE_CAP = 3050000000 * (10 ** DECIMALS);
    uint256 private constant PHASE_1 = 1061984500 * (10 ** DECIMALS);
    uint256 private constant PHASE_2 = 645057252 * (10 ** DECIMALS);
    uint256 private constant PHASE_3 = 302370586 * (10 ** DECIMALS);
    bool private preallocatedSplitDone = false;

    /**
     * @dev Event for token purchase logging.
     * @param purchaser address Who paid for the tokens.
     * @param beneficiary address Who got the tokens.
     * @param value uint256 Weis paid for purchase.
     * @param amount uint256 Amount of tokens purchased.
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
     * @dev Initialize the crowdsale.
     * @param _endTime uint256 End date of the crowdsale. In seconds. Used as a starting date for vesting.
     * @param _rate uint256 Base rate for the token purchase. Discounts may apply later.
     */
    function GifCrowdsale(uint256 _endTime, uint256 _rate) Ownable() public {
        require(_rate > 0);

        token = new GifToken();
        preSaleVesting = new PreSaleVesting(token, _endTime);
        threeTimeVesting = new ThreeTimeVesting(token, _endTime);
        fourTimeVesting = new FourTimeVesting(token, _endTime);
        rate = _rate;
        endTime = _endTime;
    }

    /**
     * @dev Mint the tokens based on the amount provided and optional bonuses given.
     * Used only by owner during the Pre-sale ICO phase.
     * @param beneficiary address Address to where the tokens shall be send to.
     * @param weiAmount uint256 Amount of wei the user sent.
     */
    function giveTokensPreSale(address beneficiary, uint256 weiAmount) public onlyOwner {
        require(beneficiary != 0x0);
        require(weiAmount != 0);

        uint256 tokens = weiAmount.mul(rate);

        require(preSaleTokensSold.add(tokens) <= PRE_SALE_CAP);

        tokens = tokens.add(tokens.div(100).mul(28));

        if (quantityBonus(tokens) > 0) {
            tokens = tokens.add(tokens.div(100).mul(quantityBonus(tokens)));
        }

        if (preSaleTokensSold.add(tokens) >= PRE_SALE_CAP) {
            tokens = tokens.sub(preSaleTokensSold.add(tokens).sub(PRE_SALE_CAP));
        }

        preSaleTokensSold = preSaleTokensSold.add(tokens);
        weiRaised = weiRaised.add(weiAmount);

        preSaleVesting.addVested(beneficiary, tokens);
        token.mint(preSaleVesting, tokens);

        TokenPurchase(
            msg.sender,
            beneficiary,
            weiAmount,
            tokens
        );
    }

    /**
     * @dev Mint the tokens based on the amount provided and optional bonuses and discount given.
     * Used only by owner during the Pre-sale ICO phase.
     * @param beneficiary address Address to where the tokens shall be send to.
     * @param weiAmount uint256 Amount of wei the user sent.
     */
    function giveTokens(address beneficiary, uint256 weiAmount) public onlyOwner {
        require(beneficiary != 0x0);
        require(weiAmount != 0);

        uint256 tokens = weiAmount.mul(rate);

        if (phaseDiscount() > 0) {
            tokens = tokens.add(tokens.div(100).mul(phaseDiscount()));
        }

        require(preSaleTokensSold.add(tokens) <= CROWDSALE_CAP);

        if (quantityBonus(tokens) > 0) {
            tokens = tokens.add(tokens.div(100).mul(quantityBonus(tokens)));
        }

        if (crowdsaleTokensSold.add(tokens) >= CROWDSALE_CAP) {
            tokens = tokens.sub(crowdsaleTokensSold.add(tokens).sub(CROWDSALE_CAP));
        }

        crowdsaleTokensSold = crowdsaleTokensSold.add(tokens);
        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, tokens);
        TokenPurchase(
            msg.sender,
            beneficiary,
            weiAmount,
            tokens
        );
    }

    /**
     * @dev Distribute preallocated vested tokens between SOCIFI, SOCIFI Ops and GIF Foundation.
     * The split amounts are defined as a percentages from total supply of the tokens.
     * @param socifi address SOCIFI address.
     * @param socifiOps address SOCIFI Ops address.
     * @param gifFoundation address GIF Foundation address.
     */
    function doPreallocatedSplit(address socifi, address socifiOps, address gifFoundation) public onlyOwner {
        require(preallocatedSplitDone == false);

        uint256 totalSupply = token.cap();
        uint256 socifiTokens = totalSupply.div(100).mul(6);
        uint256 socifiOpsTokens = totalSupply.div(100).mul(11);
        uint256 gifFoundationTokens = totalSupply.div(100).mul(22);

        threeTimeVesting.addVested(socifi, socifiTokens);
        token.mint(threeTimeVesting, socifiTokens);

        fourTimeVesting.addVested(socifiOps, socifiOpsTokens);
        fourTimeVesting.addVested(gifFoundation, gifFoundationTokens);
        token.mint(fourTimeVesting, socifiOpsTokens.add(gifFoundationTokens));

        preallocatedSplitDone = true;
    }

    /*
     * @dev Get phase number based on amount of tokens already sold.
     * @return uint256 Crowdsale phase number.
     */
    function getPhase() public view returns (uint256) {
        if (crowdsaleTokensSold <= PHASE_1)
            return 1;
        if (crowdsaleTokensSold <= PHASE_2)
            return 2;
        if (crowdsaleTokensSold <= PHASE_3)
            return 3;

        return 4;
    }

    /**
     * @dev Allows the current owner to transfer control of the token to a newOwner.
     * @param newOwner address The address to transfer ownership to.
     */
    function transferTokenOwnership(address newOwner) public onlyOwner {
        token.transferOwnership(newOwner);
    }

    /**
     * @dev Get the discount percentage based on which crowdsale phase we currently are.
     * @return uint256 Discount percentage.
     */
    function phaseDiscount() internal view returns (uint256) {

        if (getPhase() == 1)
            return 18;
        if (getPhase() == 2)
            return 10;
        if (getPhase() == 3)
            return 4;

        return 0;
    }

    /**
     * @dev Get the bonus percentage amount based on tokens purchased.
     * @param tokens uint256 Tokens purchased.
     * @return uint256 Quantity bonus percentage.
     */
    function quantityBonus(uint256 tokens) internal pure returns (uint256) {
        if (tokens <= 250000 * (10 ** DECIMALS))
            return 0;
        if (tokens <= 1250000 * (10 ** DECIMALS))
            return 1;
        if (tokens <= 2500000 * (10 ** DECIMALS))
            return 3;

        return 5;
    }
}
