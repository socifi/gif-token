#!/bin/bash

# Hereby code borrowed from https://github.com/element-group/enigma-erc20-smart-contract/blob/master/scripts/test.sh

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the testrpc instance that we started (if we started one and if it's still running).
  if [ -n "$testrpc_pid" ] && ps -p $testrpc_pid > /dev/null; then
    kill -9 $testrpc_pid
  fi
}

testrpc_running() {
  nc -z localhost 8545
}

if testrpc_running; then
  echo "Using existing testrpc instance"
else
  echo "Starting our own testrpc instance"
  # We define 10 accounts with balance 1M ether, needed for high-value tests.
  node_modules/.bin/testrpc > /dev/null &
  testrpc_pid=$!
fi

node_modules/.bin/truffle test "$@"
