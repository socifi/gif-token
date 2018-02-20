'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import {duration, increaseTimeTo} from 'zeppelin-solidity/test/helpers/increaseTime';
import util from "util";

const GifToken = artifacts.require('./../GifToken.sol');
const TokenVesting = artifacts.require('./../vesting/PreSaleVesting.sol');

contract('PreSaleVesting', function ([owner, wallet, buyer]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;

    let token;
    let tokenVesting;
    let start;

    const vestedAmount = 1000;

    beforeEach(async function () {
        token = await GifToken.new();
        start = latestTime() + duration.minutes(1); // +1 minute so it starts after contract instantiation
        tokenVesting = await TokenVesting.new(token.address, start);
        await tokenVesting.addVested(buyer, vestedAmount);
        await token.mint(tokenVesting.address, vestedAmount);
    });

    [
        // Days, expected amount to be available
        [0, 0],
        [89, 0],
        [6 * 30, 1], // Tokens are releasable (100%) after 6 months
    ].forEach(async function (data) {
        const expectedTokens = vestedAmount * data[1];

        it(
            util.format('should have %i%% of tokens available after %i days', data[1] * 100, data[0]),
            async () => {
                await increaseTimeTo(start + duration.days(data[0]));
                const result = await tokenVesting.releasableAmount.call(buyer);
                assert.equal(result, expectedTokens, util.format(
                    'Expected %s tokens to be available. %s given. ',
                    expectedTokens,
                    result
                ));
            }
        );
    });
});
