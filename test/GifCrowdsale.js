'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ether from 'zeppelin-solidity/test/helpers/ether';
import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import {duration, increaseTimeTo} from 'zeppelin-solidity/test/helpers/increaseTime';

const GifCrowdsale = artifacts.require('./GifCrowdsale.sol');
const GifToken = artifacts.require('./GifToken.sol');
const PreSaleVesting = artifacts.require('./vesting/PreSaleVesting.sol');
const FourTimeVesting = artifacts.require('./vesting/FourTimeVesting.sol');
const ThreeTimeVesting = artifacts.require('./vesting/ThreeTimeVesting.sol');

contract('GifCrowdsale', function ([owner, wallet, investor, socifi, socifiOps, gifFoundation]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;

    // Rate calculated based on ETH / USD rate in day of releasing the WhitePaper v2.07.
    const rate = 97479;

    let crowdsale;
    let token;
    let tokenVesting;
    let end;

    beforeEach(async function () {
        end = latestTime() + duration.days(5);
        crowdsale = await GifCrowdsale.new(end, rate);
        token = GifToken.at(await crowdsale.token.call());
        tokenVesting = PreSaleVesting.at(await crowdsale.preSaleVesting.call());
    });

    describe('construction', async () => {
        it('should be ownable', async () => {
            assert.equal(await crowdsale.owner.call(), owner);
        });

        it('should have GIF Token contract', async () => {
            assert.equal(await token.symbol.call(), 'GIF');
        });

        it('should own the token contract', async () => {
            assert.equal(await token.owner.call(), crowdsale.address);
        });
    });

    it ('should respect pre-sale tokens cap', async () => {
        const preSaleCap = ether(1015447128);
        await crowdsale.giveTokensPreSale(investor, preSaleCap.div(1.35).div(rate));
        assert.equal(await tokenVesting.vested.call(investor), preSaleCap.toNumber());
    });

    describe('presale investments', async () => {
        it('should sale tokens with discount', async () => {
            const investment = ether(1);
            await crowdsale.giveTokensPreSale(investor, investment);
            assert.equal(await tokenVesting.vested.call(investor), ether(131596.65).toNumber());
        });
    });

    describe('pre-sale vesting', async () => {
        let result;
        const invested = ether(10);
        const preSaleBonus = 1.35;
        const expectedTokens = invested.mul(rate * preSaleBonus);

        beforeEach(async function () {
            result = await crowdsale.giveTokensPreSale(investor, invested);
        });

        it ('should purchase tokens', async () => {
            assert.equal(result.logs[0].event, 'TokenPurchase');
        });

        it ('should update total tokens sold', async () => {
            assert.equal(await crowdsale.preSaleTokensSold.call(), expectedTokens.toNumber());
        });

        it ('should set vested amount for investor', async () => {
            assert.equal(await tokenVesting.vested.call(investor), expectedTokens.toNumber());
        });

        it ('should return no releasable amount', async () => {
            assert.equal(await tokenVesting.releasableAmount.call(investor), 0);
        });

        it ('should fail releasing tokens', async () => {
            await expectThrow(tokenVesting.release({from: investor}));
        });

        it ('should return releasable amount after 6 months', async () => {
            await increaseTimeTo(end + duration.days(6 * 30));
            assert.equal(await tokenVesting.releasableAmount.call(investor), expectedTokens.toNumber());
        });

        it ('should release tokens after 6 months', async () => {
            await increaseTimeTo(end + duration.days(6 * 30));
            const result = await tokenVesting.release({from: investor});
            assert.equal(result.logs[0].event, 'Released');
        });
    });

    describe('crowdsale', async () => {
        let result;
        const invested = ether(1);
        const expectedTokens = invested.mul(rate);

        beforeEach(async function () {
            result = await crowdsale.giveTokens(investor, invested);
        });

        it ('should purchase tokens', async () => {
            assert.equal(result.logs[0].event, 'TokenPurchase');
        });

        it ('should update total tokens sold', async () => {
            assert.equal(await crowdsale.crowdsaleTokensSold.call(), expectedTokens.toNumber());
        });

        it ('investor should own the tokens', async () => {
            assert.equal(await token.balanceOf.call(investor), expectedTokens.toNumber());
        });
    });

    describe('preallocated split', async () => {
        let result;
        let fourTimeVesting;
        let threeTimeVesting;
        let cap;

        beforeEach(async function () {
            result = await crowdsale.doPreallocatedSplit(socifi, socifiOps, gifFoundation);
            fourTimeVesting = FourTimeVesting.at(await crowdsale.fourTimeVesting.call());
            threeTimeVesting = ThreeTimeVesting.at(await crowdsale.threeTimeVesting.call());
            cap = await token.cap.call();
        });

        it ('should vest tokens for SOCIFI', async () => {
            assert.equal(await threeTimeVesting.vested.call(socifi), cap * 6 / 100);
        });

        it ('should vest tokens for SOCIFI Ops', async () => {
            assert.equal(await fourTimeVesting.vested.call(socifiOps), cap * 11 / 100);
        });

        it ('should vest tokens for GIF Foundation', async () => {
            assert.equal(await fourTimeVesting.vested.call(gifFoundation), cap * 22 / 100);
        });

    });
});
