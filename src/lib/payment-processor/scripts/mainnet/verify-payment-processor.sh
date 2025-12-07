#!/usr/bin/env bash

if [ -f .env.mainnet ]
then
  export $(cat .env.mainnet | xargs) 
else
    echo "Please set your .env.mainnet file"
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
    --chain-id 1 \
    --num-of-optimizations 600 \
    --watch \
    --constructor-args $(cast abi-encode "constructor(address,uint32,address[])" 0x67985B1f8B613b57077bbDb24A5DEFCDDA458317 2300 [0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,0xdAC17F958D2ee523a2206206994597C13D831ec7,0x6B175474E89094C44Da98b954EedeAC495271d0F]) \
    --compiler-version v0.8.9+commit.e5eed63a \
    $EXPECTED_CONTRACT_ADDRESS \
    contracts/PaymentProcessor.sol:PaymentProcessor