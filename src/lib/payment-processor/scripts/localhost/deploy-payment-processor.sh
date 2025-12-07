#!/usr/bin/env bash

if [ -f .env.localhost ]
then
  export $(cat .env.localhost | xargs) 
else
    echo "Please set your .env.localhost file"
    exit 1
fi

# Converts human readable gas to wei
./scripts/common/gweitowei.sh "${GAS_PRICE}"
gasPrice=`cat /tmp/gasfile`
rm -f /tmp/gasfile

# Converts human readable gas to wei
./scripts/common/gweitowei.sh "${PRIORITY_GAS_PRICE}"
priorityGasPrice=`cat /tmp/gasfile`
rm -f /tmp/gasfile

echo ""
echo "============= DEPLOYING CREATOR REGISTRY ============="

echo "Deployer Key: ${DEPLOYER_KEY}"
echo "RPC URL: ${RPC_URL}"
read -p "Do you want to proceed? (yes/no) " yn

case $yn in 
	yes ) echo ok, we will proceed;;
	no ) echo exiting...;
		exit;;
	* ) echo invalid response;
		exit 1;;
esac

forge script scripts/localhost/DeployPaymentProcessor.s.sol:DeployPaymentProcessor \
  --with-gas-price $gasPrice \
  --rpc-url $RPC_URL \
  --optimize \
  --optimizer-runs 600 \
  --broadcast \
  --slow
  