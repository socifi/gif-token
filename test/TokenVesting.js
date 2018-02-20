'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';

const GifToken = artifacts.require('./GifToken.sol');
const TokenVesting = artifacts.require('./mocks/TokenVestingMock.sol');

contract('TokenVesting', function ([owner, wallet, buyer]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;
    const start = latestTime();

    let token;
    let tokenVesting;

    beforeEach(async function () {
        token = await GifToken.new();
        tokenVesting = await TokenVesting.new(token.address, start);
    });

    it('should be ownable', async () => {
        assert.equal(await tokenVesting.owner.call(), owner);
    });

    it('should calculate releasable amount', async () => {
        assert.equal(await tokenVesting.releasableAmount.call('0x1'), 1200);
    });

    describe('release', async () => {
        describe('failed', async () => {
            it('should fail when no releasable tokens available', async () => {
                await expectThrow(tokenVesting.release({from: buyer}));
            });
        });

        describe('successful', async () => {

            const vestedAmount = 1337;

            beforeEach(async function () {
                await tokenVesting.addVested(buyer, vestedAmount);
                await token.mint(tokenVesting.address, vestedAmount);
            });

            it('buyer should have vested tokens available for released', async () => {
                assert.equal(await tokenVesting.vested.call(buyer), vestedAmount);
            });

            it('proper amount of releasable tokens should be calculated', async () => {
                assert.equal(await tokenVesting.releasableAmount.call(buyer), vestedAmount);
            });

            it('should release tokens', async () => {
                const result = await tokenVesting.release({from: buyer});
                assert.equal(result.logs[0].event, 'Released');
            });
        });
    });

});
