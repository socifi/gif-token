pragma solidity ^0.4.18;


import "../TokenVesting.sol";


/**
 * @title Token vesting
 * @author SOCIFI Ltd, 2018
 * @dev Vesting contract that defines 3 vesting periods.
 */
contract ThreeTimeVesting is TokenVesting {

    /**
     * @dev Initialize the contract.
     * @param _token ERC20Basic Token to be vested.
     * @param _start uint256 Date in seconds when the vesting started.
     */
    function ThreeTimeVesting(ERC20Basic _token, uint256 _start) TokenVesting(_token, _start) public {

    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param beneficiary address Address for which to get the releasable amount.
     */
    function releasableAmount(address beneficiary) public view returns (uint256) {

        uint256 month = 30 days;

        if (now < start + month) {
            return 0;
        }

        if (now < start + 9 * month) {
            // 20% after 1 months
            return vested[beneficiary].div(100).mul(20).sub(released[beneficiary]);
        }

        if (now < start + 12 * month) {
            // 30% after 9 months
            return vested[beneficiary].div(100).mul(50).sub(released[beneficiary]);
        }

        // After 12 months, return everything available.
        return vested[beneficiary].sub(released[beneficiary]);
    }
}
