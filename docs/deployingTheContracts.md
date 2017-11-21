# Deploying the contracts
The following guide may vary a bit depending on the target network. We assume,
you are going to migrate the contracts to the dev or private network.
You can follow the [Running private blockchain](docs/runninPrivateBlockchain.md)
guide to set up your private network.

The contract will be deployed using one of your accounts. You can list accounts in the
`geth` console, by running `personal.listAccounts`. If there is no account, see the
[Start mining](runninPrivateBlockchain.md#start-mining) section.

In `geth` console, run following code to temporary unlock the account so we can
interact with it:
```js
personal.unlockAccount(personal.listAccounts[0])
```

In another bash/command line window, run the migrations:
```bash
.\node_modules\.bin\truffle migrate
```

The migration of the contract has started but you need to start the miner
so the transactions that are needed for the contract to be deployed can be mined.

In the running `geth` console, run following:
```js 
miner.start(1)
// Wait till the migration in the second console is completed and stop the mining
miner.stop()
```

That's it! You should have the contract successfully migrated to your test net.

## <a name="interacting"></a> Interacting with deployed contracts
To be able to interact with the contract, you need to "watch" the contract
in the app. To add it's interface we need to know it's address and
[AIB](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI)
(Application Binnary Interface).

In another bash/command line window, start interactive `truffle` console:
```bash
.\node_modules\.bin\truffle console
```

Inside it, run following commands to get the details:
```js
GifCrowdsale.address // This will give you the contract address
JSON.stringify(GifCrowdsale.abi) // This will print the interface in JSON
```

### Watching the contract in Ethereum Wallet (or Mist)
Open the app, select desired account and click on the "Contracts" button.
Click "Watch contract" and paste the address and AIB obtained in the previous step.
This shall add the interface of the contract to the app.
