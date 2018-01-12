pragma solidity ^0.4.18;


import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title Token vesting
 * @author SOCIFI Ltd, 2018
 * @dev A token holder contract based on/inspired by OpenZeppelin's TokenVesting contract
 * that can release tokens gradually based on a vesting model.
 */
contract TokenVesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Basic;

    mapping(address => uint256) public vested;
    mapping(address => uint256) public released;
    ERC20Basic public token;
    uint256 public start;

    /**
     * @dev Event for releasing (part of) the vested tokens.
     * @param beneficiary address Beneficiary of the tokens.
     * @param amount uint256 Number of released tokens.
     */
    event Released(address beneficiary, uint256 amount);

    /**
     * @dev Initialize the token vesting with given token.
     * @param _token ERC20Basic Token to be vested.
     * @param _start uint256 Date in seconds when the vesting started.
     */
    function TokenVesting(ERC20Basic _token, uint256 _start) public {
        token = _token;
        start = _start;
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     */
    function release() public {
        uint256 unreleased = releasableAmount(msg.sender);

        require(unreleased > 0);

        released[msg.sender] = released[msg.sender].add(unreleased);

        token.safeTransfer(msg.sender, unreleased);

        Released(msg.sender, unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param beneficiary address Address for which to get the releasable amount.
     */
    function releasableAmount(address beneficiary) public view returns (uint256) {
        return vested[beneficiary].sub(released[beneficiary]);
    }

    /**
     * @dev Set number of vested tokens for given beneficiary. Callable only by owner - the Crowdsale contract.
     * @param beneficiary address Address of the beneficiary.
     * @param amount uint256 Amount of vested tokens.
     */
    function addVested(address beneficiary, uint256 amount) public onlyOwner {
        vested[beneficiary] = vested[beneficiary].add(amount);
    }
}
