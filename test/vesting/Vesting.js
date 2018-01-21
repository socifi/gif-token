'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import {duration, increaseTimeTo} from 'zeppelin-solidity/test/helpers/increaseTime';
import advanceBlock from 'zeppelin-solidity/test/helpers/advanceToBlock';

const GifToken = artifacts.require('./../GifToken.sol');
const TokenVesting = artifacts.require('./../vesting/FourTimeVesting.sol');

contract('Vesting', function ([owner, wallet, investor]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;

    let token;
    let tokenVesting;
    let start;

    const vestedAmount = 1000;

    beforeEach(async function () {
        start = latestTime() + duration.minutes(1); // +1 minute so it starts after contract instantiation
        token = await GifToken.new();
        tokenVesting = await TokenVesting.new(token.address, start);
        await tokenVesting.addVested(investor, vestedAmount);
        await token.mint(tokenVesting.address, vestedAmount);
    });

    it('investor should have vested tokens available for released', async () => {
        assert.equal(await tokenVesting.vested.call(investor), vestedAmount);
    });

    it('investor should have 5% tokens available to be released after 30 days', async () => {
        await increaseTimeTo(start + duration.days(30));
        assert.equal(await tokenVesting.releasableAmount.call(investor), vestedAmount * 0.05);
    });

    it('investor should be able to release those 5% of tokens after 30 days', async () => {
        await increaseTimeTo(start + duration.days(30));
        const result = await tokenVesting.release({from: investor});
        assert.equal(result.logs[0].event, 'Released');
    });

    it('investor should have 0 tokens available after releasing them', async () => {
        await increaseTimeTo(start + duration.days(30));
        await tokenVesting.release({from: investor});
        assert.equal(await tokenVesting.releasableAmount.call(investor), 0);
    });

    it('investor should have 20% tokens available to be released after 6 months when releasing after 1 month', async () => {
        await increaseTimeTo(start + duration.days(30));
        await tokenVesting.release({from: investor});
        await increaseTimeTo(start + duration.days(180));
        assert.equal(await tokenVesting.releasableAmount.call(investor), vestedAmount * 0.20);
    });
});
