'use strict';

import ether from 'zeppelin-solidity/test/helpers/ether';
import {increaseTimeTo, duration} from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const GifToken = artifacts.require('./GifToken.sol');
const GifCrowdsale = artifacts.require('./GifCrowdsale.sol');
const BigNumber = web3.BigNumber;

contract('GifCrowdsale', function ([owner, wallet, socifiTeam, socifiOps, gifFoundation, investor, owner2]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;

    const digits = 10 ** 18;
    const rate = new BigNumber(5000);
    const maxSupply = new BigNumber(5000000000 * digits);
    const preallocatedTokenAmount = maxSupply.mul(0.39);

    let startTime;
    let endTime;
    let tokenUnfreezeTime;
    let crowdsale;
    let token;

    beforeEach(async function () {
        startTime = latestTime() + duration.weeks(1);
        endTime = startTime + duration.weeks(1);
        tokenUnfreezeTime = endTime + duration.days(1);

        crowdsale = await GifCrowdsale.new(
            socifiTeam,
            socifiOps,
            gifFoundation,
            startTime,
            endTime,
            tokenUnfreezeTime,
            wallet,
            {
                from: owner
            }
        );
        token = GifToken.at(await crowdsale.token());
    });

    describe('construction', async () => {
        it('should be ownable', async () => {
            assert.equal(await crowdsale.owner(), owner);
        });

        it('should have correct startTime', async () => {
            assert.equal(await crowdsale.startTime(), startTime);
        });

        it('should have correct endTime', async () => {
            assert.equal(await crowdsale.endTime(), endTime);
        });

        it('should have correct rate', async () => {
            assert.equal(await crowdsale.rate(), rate.toNumber());
        });

        it('should have correct wallet', async () => {
            assert.equal(await crowdsale.wallet(), wallet);
        });

        it('should be linked to GIF Token contract', async () => {
            assert.equal(await crowdsale.token(), token.address);
        });

        it('token should have same wallet as the crowdsale contract', async () => {
            assert.equal(await token.wallet(), wallet);
        });

        it('token should have same rate as the crowdsale contract', async () => {
            assert.equal(await token.rate(), rate.toNumber());
        });

        it('token should have same end time as the crowdsale contract', async () => {
            assert.equal(await token.purchasableAfterTime(), endTime);
        });

        it('investor should have 0 tokens initially', async () => {
            assert.equal(await token.balanceOf(investor), 0);
        });
    });

    describe('preallocation', async () => {
        it('should give SOCIFI Team 6%', async () => {
            assert.equal(await token.balanceOf(socifiTeam), maxSupply.mul(0.06).toNumber());
        });

        it('should give SOCIFI Ops 11%', async () => {
            assert.equal(await token.balanceOf(socifiOps), maxSupply.mul(0.11).toNumber());
        });

        it('should give GIF Foundation 22%', async () => {
            assert.equal(await token.balanceOf(gifFoundation), maxSupply.mul(0.22).toNumber());
        });

        it('should have total number of issued tokens equal to preallocated amount', async () => {
            assert.equal(await token.totalSupply(), preallocatedTokenAmount.toNumber());
        });
    });

    describe('token purchase', async () => {
        const etherToInvest = 1;
        const dateBonus = 1.35;
        const investmentAmount = ether(etherToInvest);
        const expectedTokenAmount = rate.mul(investmentAmount).mul(dateBonus);
        const expectedTotalSupply = (new BigNumber(etherToInvest)).mul(rate).mul(digits).mul(dateBonus)
            .add(preallocatedTokenAmount);

        beforeEach(async () => {
            await increaseTimeTo(startTime);
        });

        describe('general', async () => {
            beforeEach(async () => {
                await crowdsale.buyTokens(investor, {value: investmentAmount, from: investor});
            });

            it('should update total supply', async function () {
                assert.equal(await token.totalSupply(), expectedTotalSupply.toNumber());
            });

            it('should update investor balance', async function () {
                assert.equal(await token.balanceOf(investor), expectedTokenAmount.toNumber());
            });

            it('wei raised amount should be updated on crowdsale contract', async () => {
                assert.equal(await crowdsale.weiRaised(), investmentAmount.toNumber());
            })
        });

        describe('pausable lifecycle', async () => {
            beforeEach(async () => {
                await crowdsale.pause();
            });

            it('should not sale when paused', async function () {
                await assert.isRejected(crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}), 'revert');
            });

            it('should sale when not paused', async function () {
                await crowdsale.unpause();
                await crowdsale.buyTokens(investor, {value: investmentAmount, from: investor});

                assert.equal(await token.balanceOf(investor), expectedTokenAmount.toNumber());
                assert.equal(await token.totalSupply(), expectedTotalSupply.toNumber());
            });
        });
    });

    describe('token owner', async () => {
        it('should be crowdsale contract', async () => {
            assert.equal(await token.owner(), crowdsale.address);
        });

        it('should be changeable to someone else', async () => {
            await crowdsale.transferTokenOwnership(owner2);
            assert.equal(await token.owner(), owner2);
        });
    });

    describe('minting', async () => {
        const tokensToMint = new BigNumber(1337).mul(digits);
        let startSupply;

        beforeEach(async () => {
            startSupply = await token.totalSupply();
            await crowdsale.mintTokens(investor, tokensToMint);
        });

        it('should update total supply', async () => {
            assert.equal(await token.totalSupply(), startSupply.add(tokensToMint).toNumber());
        });

        it('should update investor balance', async () => {
            assert.equal(await token.balanceOf(investor), tokensToMint.toNumber());
        });

        it('wei raised amount should not be updated on crowdsale contract', async () => {
            assert.equal(await crowdsale.weiRaised(), 0);
        })
    });
});
