pragma solidity ^0.4.17;


import "../TokenVesting.sol";


/**
 * @title Token vesting mock
 * @dev Mock used for testing the vesting amounts.
 */
contract TokenVestingMock is TokenVesting {

    /**
     * @dev Initialize the contract with some mocked data.
     * @param _token ERC20Basic Token to be vested.
     * @param _start uint256 Date in seconds when the vesting started.
     */
    function TokenVestingMock(ERC20Basic _token, uint256 _start) TokenVesting(_token, _start) public {
        vested[0x1] = 1337;
        released[0x1] = 137;
    }
}
