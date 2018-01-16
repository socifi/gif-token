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

    // Rate calculated based on ETH / USD rate in times of writing the whitepaper.
    const rate = 50000;

    let crowdsale;
    let token;
    let tokenVesting;
    let start;
    let end;

    beforeEach(async function () {
        start = latestTime() + duration.minutes(1); // +1 minute so it starts after contract instantiation
        end = start + duration.days(5);
        crowdsale = await GifCrowdsale.new(start, end, rate);
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
        const preSaleCap = ether(406666667);
        await crowdsale.giveTokensPreSale(investor, preSaleCap/rate - ether(1000));
        assert.equal(await tokenVesting.vested.call(investor), preSaleCap.toNumber());
    });

    describe('pre-sale vesting', async () => {
        let result;
        const invested = 10;
        const preSaleBonus = 1.28;
        const quantityBonus = 1.01;
        const expectedTokens = invested * rate * preSaleBonus * quantityBonus;

        beforeEach(async function () {
            result = await crowdsale.giveTokensPreSale(investor, invested);
        });

        it ('should purchase tokens', async () => {
            assert.equal(result.logs[0].event, 'TokenPurchase');
        });

        it ('should update total tokens sold', async () => {
            assert.equal(await crowdsale.preSaleTokensSold.call(), expectedTokens);
        });

        it ('should set vested amount for investor', async () => {
            assert.equal(await tokenVesting.vested.call(investor), expectedTokens);
        });

        it ('should return no releasable amount', async () => {
            assert.equal(await tokenVesting.releasableAmount.call(investor), 0);
        });

        it ('should fail releasing tokens', async () => {
            await expectThrow(tokenVesting.release({from: investor}));
        });

        it ('should return releasable amount after 90 days', async () => {
            await increaseTimeTo(end + duration.days(90));
            assert.equal(await tokenVesting.releasableAmount.call(investor), expectedTokens);
        });

        it ('should release tokens after 90 days', async () => {
            await increaseTimeTo(end + duration.days(90));
            const result = await tokenVesting.release({from: investor});
            assert.equal(result.logs[0].event, 'Released');
        });
    });

    describe('crowdsale', async () => {
        let result;
        const invested = 1;
        const phaseBonus = 116;
        const expectedTokens = invested * rate * phaseBonus / 100;

        beforeEach(async function () {
            result = await crowdsale.giveTokens(investor, invested);
        });

        it ('should purchase tokens', async () => {
            assert.equal(result.logs[0].event, 'TokenPurchase');
        });

        it ('should update total tokens sold', async () => {
            assert.equal(await crowdsale.crowdsaleTokensSold.call(), expectedTokens);
        });

        it ('investor should own the tokens', async () => {
            assert.equal(await token.balanceOf.call(investor), expectedTokens);
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
