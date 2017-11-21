require('babel-register')({
    // Need to be explicitly specified to allow importing helpers from Zeppelin Solidity written also in ES2015.
    only: '/test/'
});
require('babel-polyfill');

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*",
        },
    }
};
