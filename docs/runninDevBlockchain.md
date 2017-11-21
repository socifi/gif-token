# Running dev blockchain
For sandbox testing, it is best to start with a dev blockchain.
It requires no setup to run. Just run `geth --dev --datadir ./data --rpc console`.

## Start mining
If you're running the node for the first time, you need to create at least one
account. In the console, run following:

```js
personal.newAccount()
```

To get some Ether and to be able to interact with the blockchain, you need
to start "mining". To do this, run `miner.start(1)` in the console.
The `1` says to mine using only one CPU thread. Otherwise, it would
kill your CPU.

As you do not need to mine all the time, you can stop it by running `miner.stop()`.

Now you can interact with the Mist/Ethereum Wallet and only when you are about to
execute something, start the miner again.

## Running Ethereum Wallet (or Mist)
Depending on you OS, you may simply start the Ethereum Wallet and it shall
connect automatically to the running node over IPC.

If you need to specify the path to connect the Ethereum Wallet to, run following.
Make sure the path in RPC flag is the same as the one defined in "Starting the node".
```bash
ethereumwallet --rpc ./data/geth.ipc
```

### Cleaning the data
If you want to start from scratch, delete all accounts, wallets, contracts, etc,
simply delete the `./data` dir and start over.
