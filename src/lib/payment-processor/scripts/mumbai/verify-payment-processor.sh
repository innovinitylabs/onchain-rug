#!/usr/bin/env bash

if [ -f .env.mumbai ]
then
  export $(cat .env.mumbai | xargs) 
else
    echo "Please set your .env.mumbai file"
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
    --chain-id 80001 \
    --num-of-optimizations 600 \
    --watch \
    --constructor-args $(cast abi-encode "constructor(address,uint32,address[])" 0x67985B1f8B613b57077bbDb24A5DEFCDDA458317 2300 [0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889]) \
    --compiler-version v0.8.9+commit.e5eed63a \
    $EXPECTED_CONTRACT_ADDRESS \
    contracts/PaymentProcessor.sol:PaymentProcessor