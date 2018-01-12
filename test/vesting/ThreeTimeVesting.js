'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import {duration, increaseTimeTo} from 'zeppelin-solidity/test/helpers/increaseTime';
import util from 'util';

const GifToken = artifacts.require('./../GifToken.sol');
const TokenVesting = artifacts.require('./../vesting/ThreeTimeVesting.sol');

contract('FourTimeVesting', function ([owner, wallet, investor]) {

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
        await tokenVesting.addVested(investor, vestedAmount);
        await token.mint(tokenVesting.address, vestedAmount);
    });

    [
        // Days, expected % to be available
        [0, 0],
        [29, 0],
        [30, 0.20], // 20% after 1 months
        [179, 0.20],
        [270, 0.50], // 30% after 9 months
        [359, 0.50],
        [360, 1], // The rest (50%) after 12 months
    ].forEach(async function (data) {
        const expectedTokens = vestedAmount * data[1];

        it(
            util.format('should have %i%% of tokens available after %i days', data[1] * 100, data[0]),
            async () => {
                await increaseTimeTo(start + duration.days(data[0]));
                const result = await tokenVesting.releasableAmount.call(investor);
                assert.equal(result, expectedTokens, util.format(
                    'Expected %s tokens to be available. %s given. ',
                    expectedTokens,
                    result
                ));
            }
        );
    });
});
