'use strict';

import ether from 'zeppelin-solidity/test/helpers/ether';
import {advanceBlock} from 'zeppelin-solidity/test/helpers/advanceToBlock';
import {increaseTimeTo, duration} from 'zeppelin-solidity/test/helpers/increaseTime';
import latestTime from 'zeppelin-solidity/test/helpers/latestTime';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const GifToken = artifacts.require('./GifToken.sol');
const BigNumber = web3.BigNumber;

contract('GifToken', function ([owner, wallet, investor]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;

    let token;
    const rate = new BigNumber(5000);
    const maxSupply = (new BigNumber(5000000000)).mul(10 ** 18);

    beforeEach(async function () {
        const purchasableAfterTime = latestTime() + duration.days(30);
        const transferableAfterTime = purchasableAfterTime + duration.days(7);
        token = await GifToken.new(purchasableAfterTime, transferableAfterTime, wallet, rate);
    });

    describe('construction', async () => {
        it('should be ownable', async () => {
            assert.equal(await token.owner(), owner);
        });

        it('should return correct name after construction', async () => {
            assert.equal(await token.name(), 'GIF Token');
        });

        it('should return correct symbol after construction', async () => {
            assert.equal(await token.symbol(), 'GIF');
        });

        it('should return correct decimal points after construction', async () => {
            assert.equal(await token.decimals(), 18);
        });

        it('should have 0 tokens after construction', async () => {
            assert.equal(await token.totalSupply(), 0);
        });

        it('should have correct max supply after construction', async () => {
            assert.equal(await token.maxSupply(), maxSupply.toNumber());
        });
    });

    describe('minting', async () => {
        it('should mint tokens correctly', async function () {
            assert.equal(await token.balanceOf(wallet), 0);
            await token.mint(wallet, 100);
            assert.equal(await token.balanceOf(wallet), 100);
        });

        it('should allow minting up to max supply', async function () {
            await token.mint(wallet, maxSupply);
            assert.equal(await token.balanceOf(wallet), maxSupply.toNumber());
        });

        it('should limit the total number of minted tokens', async function () {
            await assert.isRejected(token.mint(wallet, maxSupply.add(1)), 'revert');
        });

        it('should restrict minting to owner', async function () {
            await assert.isRejected(token.mint(wallet, 100, {from: wallet}), 'revert');
        });
    });

    describe('purchasing', async () => {
        it('should not allow purchase before ICO ends', async function () {
            await assert.isRejected(token.buyTokens(investor, {value: ether(1), from: investor}), 'revert');
        });

        it('should allow purchase after ICO ends', async function () {
            increaseTimeTo((await token.transferableAfterTime()).add(duration.seconds(1)).toNumber());
            assert.equal(await token.balanceOf(investor), 0);

            await token.unfreeze(10);
            await token.buyTokens(investor, {value: ether(1), from: investor});

            assert.equal(await token.balanceOf(investor), ether(1) * rate);
        });
    });

    describe('transferring', async () => {
        const amount = 100;

        beforeEach(async function () {
            await token.mint(investor, amount);
        });

        it('investor should have 100 tokens initially', async function () {
            assert.equal(await token.balanceOf(investor), 100);
        });

        it('destination wallet should have 0 tokens initially', async function () {
            assert.equal(await token.balanceOf(wallet), 0);
        });

        it('should not allow transfer when locked', async function () {
            await assert.isRejected(token.transfer(wallet, amount, {from: investor}), 'revert');
        });

        it('should allow transfer after lock pass', async function () {
            increaseTimeTo((await token.transferableAfterTime()).add(duration.seconds(1)).toNumber());

            await token.transfer(wallet, amount, {from: investor});

            assert.equal(await token.balanceOf(investor), 0);
            assert.equal(await token.balanceOf(wallet), 100);
        });
    });

    describe('unfreezing', async () => {
        beforeEach(async function () {
            assert.equal(await token.availableSupply(), 0);
            await token.unfreeze(10);
            await advanceBlock();
        });

        it('should unfreeze 10% tokens', async function () {
            assert.equal(await token.availableSupply(), maxSupply.div(10).toNumber());
        });

        it('should correctly unfreeze 2 times', async function () {
            await token.unfreeze(10);
            await advanceBlock();

            assert.equal(await token.availableSupply(), maxSupply.div(5).toNumber());
        });
    });
});
