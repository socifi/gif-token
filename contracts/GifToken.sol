pragma solidity ^0.4.18;


import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/CappedToken.sol";


/**
 * @title GIF Token
 * @author SOCIFI Ltd, 2018
 * @dev An ERC20 mintable token with capped supply at 5,000,000,000 GIF Tokens.
 */
contract GifToken is CappedToken {
    using SafeMath for uint256;

    /* solium-disable-next-line */
    string public constant name = "Gift token";
    /* solium-disable-next-line */
    string public constant symbol = "GIF";
    /* solium-disable-next-line */
    uint256 public constant decimals = 18;
    /* solium-disable-next-line */
    uint256 public constant cap = 5000000000 * (10 ** decimals);

    /**
     * @dev Initialize the token with configured cap.
     */
    function GifToken() CappedToken(cap) public {

    }
}
