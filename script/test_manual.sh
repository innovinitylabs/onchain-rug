#!/bin/bash

# Manual testing script for OnchainRugs deployment
# Run individual commands to test deployment step by step

echo "Manual testing script for OnchainRugs deployment"
echo "Run these commands one by one to test the deployment"
echo ""

# Check balance
echo "1. Check deployer balance:"
echo 'cast balance $(cast wallet address --private-key $PRIVATE_KEY)'
echo ""

# Deploy infrastructure
echo "2. Deploy FileStore:"
echo 'forge script script/DeployShapeSepolia.s.sol:DeployShapeSepolia --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --sig "deployInfrastructure()"'
echo ""

echo "3. Deploy Diamond system:"
echo 'forge script script/DeployShapeSepolia.s.sol:DeployShapeSepolia --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --sig "deployDiamond()"'
echo ""

echo "4. Configure Diamond:"
echo 'forge script script/DeployShapeSepolia.s.sol:DeployShapeSepolia --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --sig "configureDiamond()"'
echo ""

echo "5. Upload libraries:"
echo 'forge script script/DeployShapeSepolia.s.sol:DeployShapeSepolia --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --sig "uploadLibraries()"'
echo ""

echo "6. Initialize system:"
echo 'forge script script/DeployShapeSepolia.s.sol:DeployShapeSepolia --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --sig "initializeSystem()"'
echo ""

echo "7. Test minting:"
echo 'cast send $DIAMOND_ADDRESS "mintRug(string[])" ["test","rug"] --value 0.00003ether --rpc-url $RPC_URL --private-key $PRIVATE_KEY'
echo ""

echo "8. Check token URI:"
echo 'cast call $DIAMOND_ADDRESS "tokenURI(uint256)" 1 --rpc-url $RPC_URL'
echo ""

echo "9. Check rug data:"
echo 'cast call $DIAMOND_ADDRESS "getRugData(uint256)" 1 --rpc-url $RPC_URL'
echo ""

echo "10. Check aging data:"
echo 'cast call $DIAMOND_ADDRESS "getAgingData(uint256)" 1 --rpc-url $RPC_URL'
echo ""

echo "11. Check mint price:"
echo 'cast call $DIAMOND_ADDRESS "getMintPrice()" --rpc-url $RPC_URL'
echo ""

echo "12. Check maintenance options:"
echo 'cast call $DIAMOND_ADDRESS "getMaintenanceOptions(uint256)" 1 --rpc-url $RPC_URL'
echo ""

echo "13. Check aging state:"
echo 'cast call $DIAMOND_ADDRESS "getAgingState(uint256)" 1 --rpc-url $RPC_URL'
echo ""

echo "14. Check contract status:"
echo 'cast call $DIAMOND_ADDRESS "getConfig()" --rpc-url $RPC_URL'
echo ""
