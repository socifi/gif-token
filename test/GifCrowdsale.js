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

    // Rate calculated based on ETH / USD rate in day of releasing the WhitePaper v2.06.
    const rate = 41438;

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
        const preSaleCap = ether(842238054);
        await crowdsale.giveTokensPreSale(investor, preSaleCap/rate);
        assert.equal(await tokenVesting.vested.call(investor), preSaleCap.toNumber());
    });

    describe('presale investments', async () => {
        it('should only get a regular bonus', async () => {
            const investment = ether(1);
            await crowdsale.giveTokensPreSale(investor, investment);
            assert.equal(await tokenVesting.vested.call(investor), ether(53040.64).toNumber());
        });

        it('should get a regular bonus + quantity bonus level 1', async () => {
            const investment = ether(5);
            await crowdsale.giveTokensPreSale(investor, investment);
            assert.equal(await tokenVesting.vested.call(investor), ether(267855.232).toNumber());
        });

        it('should get a regular bonus + quantity bonus level 2', async () => {
            const investment = ether(25);
            await crowdsale.giveTokensPreSale(investor, investment);
            assert.equal(await tokenVesting.vested.call(investor), ether(1365796.48).toNumber());
        });

        it('should get a regular bonus + quantity bonus level 3', async () => {
            const investment = ether(50);
            await crowdsale.giveTokensPreSale(investor, investment);
            assert.equal((await tokenVesting.vested.call(investor)).toNumber(), ether(2784633.6).toNumber());
        });

    });

    describe('pre-sale vesting', async () => {
        let result;
        const invested = ether(10);
        const preSaleBonus = 1.28;
        const quantityBonus = 1.01;
        const expectedTokens = invested.mul(rate * preSaleBonus * quantityBonus);

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
        const phaseBonus = 118;
        const expectedTokens = invested.mul(rate * phaseBonus).div(100);

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
