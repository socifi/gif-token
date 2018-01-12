# GIF Token contracts

## Table of contents
* [GIF Token](#gif-token)
* [Crowdsale](#crowdsale)
* [Vesting](#vesting)

## <a name="about-contracts"></a> About contracts
Contracts are located in the [`contracts`](../contracts/) directory. They are written in [Solidity](https://solidity.readthedocs.io) language with the help of the [OpenZepplelin](https://openzeppelin.org/) framework and baked using the [Truffle](http://truffleframework.com/) development tool.

### <a name="gif-token"></a> GIF Token
Code located in [`GifToken.sol`](../contracts/GifToken.sol)
represents the GIF Token based on [ERC20](https://en.wikipedia.org/wiki/ERC20)
[standard](https://theethereum.wiki/w/index.php/ERC20_Token_Standard).

This is a globally recognized standard for custom tokens, coins and
other assets that defines the basic functionality and offers a great support
in most Ethereum related applications.

### <a name="crowdsale"></a> Crowdsale
Crowdsale contract located in [`GifCrowdsale.sol`](../contracts/GifCrowdsale.sol)
is used for the SOCIFI ICO. It handles the investment process (buying tokens +
giving the bonus tokens), distributing tokens and their vesting, initial splitting between SOCIFI Team,
SOCIFI Ops, GIF Foundation, and Investors.

### <a name="vesting"></a> Vesting
To allow vesting of the tokens, we implemented three vesting contracts.
The [`PreSaleVesting`](../contracts/vesting/PreSaleVesting.sol),
[`ThreeTimeVesting`](../contracts/vesting/ThreeTimeVesting.sol) and
[`FourTimeVesting`](../contracts/vesting/FourTimeVesting.sol).

The Pre-sale vesting is used for tokens purchased during the Pre-sale.
Three and Four time vesting contracts are used for the tokens allocated to
SOCIFI, SOCIFI Ops and GIF Foundation.

When the tokens are purchased during the Pre-sale, or when the tokens are split to
mentioned subjects, the tokens are minted to address of the corresponding contract
and vesting rights are saved in the same contract.

Once the vesting time defined in the WhitePaper pass, the investor/subject can call
the `release()` function of the corresponding contract and release the (part of the)
vested tokens to their original address.
