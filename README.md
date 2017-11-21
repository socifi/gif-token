# SOCIFI Crowdsale & GIF Token contracts
_An `ERC-20` smart contract for GIF token and crowdsale contract._

Please see the official [website](https://gif.network/) for most recent
updates and changes. The details of the GIF Token, the ICO (crowdsale)
are described in the WhitePaper which can be found on the mentioned website.

## Table of contents
* [About contracts](#about-contracts)
  * [GIF Token](#gif-token)
  * [Crowdsale (ICO)](#crowdsale-ico)
* [Running dev blockchain](docs/runninDevBlockchain.md)
* [Running private blockchain](docs/runninPrivateBlockchain.md)
* [Deploying the contracts](docs/deployingTheContracts.md)
  * [Interacting with deployed contracts](docs/deployingTheContracts.md#interacting)

## <a name="about-contracts"></a> About contracts
### <a name="gif-token"></a> GIF Token
Contract located in [`contracts/GifToken.sol`](contracts/GifToken.sol)
represents a GIF Token based on [ERC20](https://en.wikipedia.org/wiki/ERC20)
[standard](https://theethereum.wiki/w/index.php/ERC20_Token_Standard).
This is a globally recognized standard for custom tokens, coins and
other assets that define the basic functionality and offer great support
in most Ethereum related applications.

The GIF Token also implements a Lock-Up mechanism. This locks the trading
abilities of the token for first 7 days after the ICO ends. After this period,
all tokens are 100% tradable. This behavior is defined in `contracts/TimeScheduledToken.sol`. 

### <a name="crowdsale-ico"></a> Crowdsale (ICO)
Crowdsale contract located in [`contracts/GifCrowdsale.sol`](contracts/GifCrowdsale.sol)
is used for SOCIFI ICO. It handles the investment process (buying tokens +
giving the bonus tokens), distributing tokens, initial splitting between SOCIFI Team,
SOCIFI Ops, GIF Foundation and investors.
