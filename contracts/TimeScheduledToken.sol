pragma solidity ^0.4.11;


/**
 * @title Time schedule token contract.
 * @author SOCIFI Ltd, 2017
 * @dev Adds ability to control since what time the token is purchasable and transferable.
 */
contract TimeScheduledToken {
    uint256 public purchasableAfterTime;
    uint256 public transferableAfterTime;

    /**
     * @dev Contract constructor.
     * @param _purchasableAfterTime uint256 After what time the token is purchasable.
     * @param _transferableAfterTime uint256 After what time the token is transferable.
     */
    function TimeScheduledToken(uint256 _purchasableAfterTime, uint256 _transferableAfterTime) public {
        purchasableAfterTime = _purchasableAfterTime;
        transferableAfterTime = _transferableAfterTime;
    }

    /**
     * @dev Modifier that checks whether the token is already transferable.
     */
    modifier whenTransferable() {
        require(now > transferableAfterTime);
        _;
    }

    /**
     * @dev Modifier that checks whether the token is purchasable.
     */
    modifier whenPurchasable() {
        require(now > purchasableAfterTime);
        _;
    }
}
