require('babel-register')({
    // Need to be explicitly specified to allow importing helpers from Zeppelin Solidity written also in ES2015.
    only: '/test/'
});
require('babel-polyfill');

module.exports = {
    networks: {
        local: {
            host: "localhost",
            port: 8545,
            network_id: "*",
            gas: 4700000,
        },
        coverage: {
            host: "localhost",
            port: 8555,
            network_id: "*",
            gas: 0xfffffffffff,
            gasPrice: 0x01,
        },
    }
};
