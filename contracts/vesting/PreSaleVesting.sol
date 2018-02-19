pragma solidity ^0.4.18;


import "../TokenVesting.sol";


/**
 * @title Token vesting
 * @author SOCIFI Ltd, 2018
 * @dev Vesting contract that defines 1 vesting periods - used for Pre-sale token sale.
 */
contract PreSaleVesting is TokenVesting {

    /**
     * @dev Initialize the contract.
     * @param _token ERC20Basic Token to be vested.
     * @param _start uint256 Date in seconds when the vesting started.
     */
    function PreSaleVesting(ERC20Basic _token, uint256 _start) TokenVesting(_token, _start) public {

    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param beneficiary address Address for which to get the releasable amount.
     */
    function releasableAmount(address beneficiary) public view returns (uint256) {

        uint256 month = 30 days;

        if (now < start + 6 * month) {
            // If less then 6 months return 0
            return 0;
        }

        // Otherwise, return everything available.
        return vested[beneficiary].sub(released[beneficiary]);
    }
}
