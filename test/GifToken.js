'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ether from 'zeppelin-solidity/test/helpers/ether';
import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';

const GifToken = artifacts.require('./GifToken.sol');

contract('GifToken', function ([owner, wallet]) {

    chai.use(chaiAsPromised);
    const assert = chai.assert;

    let token;

    const cap = ether(5000000000);

    beforeEach(async function () {
        token = await GifToken.new();
    });

    describe('construction', async () => {
        it('should be ownable', async () => {
            assert.equal(await token.owner.call(), owner);
        });

        it('should return correct name after construction', async () => {
            assert.equal(await token.name.call(), 'Gift token');
        });

        it('should return correct symbol after construction', async () => {
            assert.equal(await token.symbol.call(), 'GIF');
        });

        it('should return correct decimal points after construction', async () => {
            assert.equal(await token.decimals.call(), 18);
        });

        it('should have zero total supply after construction', async () => {
            assert.equal(await token.totalSupply.call(), 0);
        });

        it('should have correct cap limit after construction', async () => {
            assert.equal(await token.cap.call(), cap.toNumber());
        });
    });

    describe('minting', async () => {
        it('should mint tokens correctly', async function () {
            const result = await token.mint(wallet, 100);
            assert.equal(result.logs[0].event, 'Mint');
            assert.equal(await token.balanceOf.call(wallet), 100);
        });

        it('should allow minting up to cap limit', async function () {
            await token.mint(wallet, cap);
            assert.equal(await token.balanceOf.call(wallet), cap.toNumber());
        });

        it('should limit the total number of minted tokens', async function () {
            await token.mint(wallet, cap);
            await expectThrow(token.mint(wallet, 1));
        });

        it('should restrict minting to owner', async function () {
            await expectThrow(token.mint(wallet, 100, {from: wallet}));
        });
    });
});
