'use strict';

const GifCrowdsale = artifacts.require('./GifCrowdsale.sol');

module.exports = (deployer, network, accounts) => {

    // The contract will be deployed on behalf of this address.
    const fromAddress = accounts[0];

    // NOTE: The month parameter is indexed from zero!
    const icoEnd = new Date(Date.UTC(2018, 1, 13, 23, 59, 59));

    const rate = 50000;

    deployer.deploy(
        GifCrowdsale,
        icoEnd.getTime() / 1000,
        rate,
        {
            from: fromAddress,
        },
    );
};
