# Running private blockchain
To play with the contracts in real world-like environment, you may want to
set-up your own private blockchain.

## Initializing the blockchain
Create `genesis.json` file at some directory.

**Important note:**
The most important value is `config.chainId`. Try to not interfere with official
networks and note that when chainId is zero, no transactions are possible
including contracts.
```json
{
  "config": {
        "chainId": 8888,
        "homesteadBlock": 0,
        "eip155Block": 0,
        "eip158Block": 0
    },
  "alloc" : {
  },
  "coinbase"   : "0x0000000000000000000000000000000000000000",
  "difficulty" : "0x400",
  "extraData"  : "",
  "gasLimit"   : "0x80000000",
  "nonce"      : "0x0000000000000042",
  "mixhash"    : "0x0000000000000000000000000000000000000000000000000000000000000000",
  "parentHash" : "0x0000000000000000000000000000000000000000000000000000000000000000",
  "timestamp"  : "0x00"
}
```

Then run this command to initialize the new blockchain. Ensure the the directory
used in `datadir` flag is either empty or does not exist.
```bash
geth --datadir ./data init genesis.json
```

## Starting the node
After the blockchain has been initialized, you can start a node. Use the same
network Id and data directory as defined in the `genesis.json`.
```bash
geth --networkid 8888 --datadir ./data --rpc --rpccorsdomain "*"
```

Now, we can attach a console to the running node to interact with it.
```bash
geth attach
```

Depending on you OS, you may need to specify the IPC or HTTP URI.
```bash
geth attach ipc:./data/geth.ipc
geth attach http://127.0.0.1:8545
```

**Important note:**
Using IPC is highly preferred and more secure. The http may also limits some
commands.

## Starting more nodes (optional)

### Preparations

For connecting more nodes to network you'll need one or more bootnodes (each node might act as bootnode if it has visible IP address). To connect to existing network enode and IP addresses of each bootnode is needed. IP address might be obtained by issuing `ifconfig` or `ip address` on linux and `ipconfig` on windows. Enode address is given either in output during node boot or might be obtained by issuing `admin.nodeInfo.enode` in console attached to running node.

All nodes on network need to agree on genesis block, therefore the same `genesis.json` is needed for both bootnodes and nodes. Unfortunately node is not able to download genesis block from bootnode, so you need to initialize it similarly to the first node. This is done by copying `genesis.json` and running following command.
```bash
geth --datadir ./anotherdata init genesis.json
```

### On different computer

If the node is running on different computer, there should be no problem with default ports as they shouldn't be used. Only thing needed is to provide right coma-separated enode adresses of bootnodes. The `[::]` in each enode should be replaced by `[ip address]` of respective bootnode.

```bash
geth --networkid 8888 --datadir ./anotherdata --rpc --rpccorsdomain "*" --bootnodes "enode://6286a7b706253eae3590ff08a91749ff073598f024ac14750a530ac51cd4292f859d2ad1b3a57ae5200a8586c72be1fb360a756550592ab7698c9c3479ab5257@[::]:30303"
```

**Important note:**
Bootnode does not introduce a node to other bootnodes or peers, so all bootnodes need to be specified on boot.


### On the same computer

It is also possible to run second node on the same computer. You'll just need to change ports (both rpc and eth) and also provide correct enode addresses.

```bash
geth --networkid 8888 --datadir ./anotherdata --rpc --rpcport 8046 --rpccorsdomain "*" --port 30302 --bootnodes "enode://6286a7b706253eae3590ff08a91749ff073598f024ac14750a530ac51cd4292f859d2ad1b3a57ae5200a8586c72be1fb360a756550592ab7698c9c3479ab5257@[::]:30303"
```

## <a name=""></a> Start mining
If you're running the node for the first time, you need to create at least one
account. In the console, run following:

```js
personal.newAccount('P4ssw0rd')
```

To get some Ether and to be able to interact with the blockchain, you need
to start "mining". To do this, run `miner.start(1)` in the console.
The `1` says to mine using only one CPU thread. Otherwise you would
kill your CPU.

As you do not need to mine all the time, you can stop it by running `miner.stop()`.

Now you can interact with the Mist/Ethereum Wallet and only when you are about to
execute something, start the miner again.

## Running Ethereum Wallet (or Mist)
Depending on you OS, you may simply start the Ethereum Wallet and it shall
connect automatically to the running node over IPC.

If you need to specify the path to connect the Ethereum Wallet to, run following.
Make sure the path in rpc flag is the same as the one defined in "Starting the node".
```bash
ethereumwallet --rpc ./data/geth.ipc
```

### Cleaning the data
If you want to start from scratch, delete all accounts, wallets, contracts, etc,
simply delete the `./data` dir and start over.
