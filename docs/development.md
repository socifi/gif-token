## Development
We recommend using some Intellij editor (e.g. PHPStorm, WebStorm, ...) with
[Solidity](https://plugins.jetbrains.com/plugin/9475-intellij-solidity)
plugin.
```bash
npm install
```

### Testing
```bash
npm test
```

#### Windows
Use Bash to run the npm scripts (`npm run ...`).
Alternatively, you may run following:
```cmd
.\node_modules\.bin\testrpc
.\node_modules\.bin\truffle test
```

## Blockchain setup
### Starting and preparing the blockchain
Download [geth](https://geth.ethereum.org/)

#### Start private test net:

```bash
geth --dev --datadir="./data" --rpc
```
In another window, run `geth attach`. This will open
[javascript console](https://github.com/ethereum/go-ethereum/wiki/JavaScript-Console)
, where you can interact with the network using the
[Management API](https://github.com/ethereum/go-ethereum/wiki/Management-APIs)
or the full
[Web3 javascript API](https://github.com/ethereum/wiki/wiki/JavaScript-API).
```js
personal.newAccount() // You can leave the pass phrase empty.
mminer.start(1)       // Run miner with one thread
```

