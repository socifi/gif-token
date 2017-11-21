'use strict';

const GifCrowdsale = artifacts.require('./GifCrowdsale.sol');

module.exports = (deployer, network, accounts) => {

    // The contract will be deployed on behalf of this address.
    const fromAddress = accounts[0];

    // Address of account/wallet where the raised funds (ETH) shall be collected
    const walletAddress = accounts[1];

    // Addresses for preallocated split.
    const socifiTeamAddress = accounts[2];
    const socifiOpsAddress = accounts[3];
    const gifFoundationAddress = accounts[4];

    // ICO + lock up dates.
    // NOTE: The month parameter is indexed from zero!
    const icoStart = new Date(Date.UTC(2017, 11, 6, 0, 0, 1));
    const icoEnd = new Date(Date.UTC(2017, 11, 26, 23, 59, 59));
    const tokenUnfreeze = new Date(Date.UTC(2018, 0, 2, 0, 0, 0));

    deployer.deploy(
        GifCrowdsale,
        socifiTeamAddress,
        socifiOpsAddress,
        gifFoundationAddress,
        icoStart.getTime() / 1000,
        icoEnd.getTime() / 1000,
        tokenUnfreeze.getTime() / 1000,
        walletAddress,
        {
            from: fromAddress,
        },
    );
};
