#!/usr/bin/env bash

if [ -f .env.polygon ]
then
  export $(cat .env.polygon | xargs) 
else
    echo "Please set your .env.polygon file"
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
    --chain-id 137 \
    --num-of-optimizations 600 \
    --watch \
    --constructor-args $(cast abi-encode "constructor(address,uint32,address[])" 0x67985B1f8B613b57077bbDb24A5DEFCDDA458317 2300 [0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270,0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174,0xc2132D05D31c914a87C6611C10748AEb04B58e8F,0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063]) \
    --compiler-version v0.8.9+commit.e5eed63a \
    $EXPECTED_CONTRACT_ADDRESS \
    contracts/PaymentProcessor.sol:PaymentProcessor