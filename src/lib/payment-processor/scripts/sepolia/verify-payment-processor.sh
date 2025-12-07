#!/usr/bin/env bash

if [ -f .env.sepolia ]
then
  export $(cat .env.sepolia | xargs) 
else
    echo "Please set your .env.sepolia file"
    exit 1
fi

echo ""
echo "============= DEPLOYING CREATOR REGISTRY ============="

echo "RPC URL: ${RPC_URL}"
read -p "Do you want to proceed? (yes/no) " yn

case $yn in 
	yes ) echo ok, we will proceed;;
	no ) echo exiting...;
		exit;;
	* ) echo invalid response;
		exit 1;;
esac

forge verify-contract \
    --chain-id 11155111 \
    --num-of-optimizations 600 \
    --watch \
    --constructor-args $(cast abi-encode "constructor(address,uint32,address[])" 0x67985B1f8B613b57077bbDb24A5DEFCDDA458317 2300 [0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14]) \
    --compiler-version v0.8.9+commit.e5eed63a \
    $EXPECTED_CONTRACT_ADDRESS \
    contracts/PaymentProcessor.sol:PaymentProcessor