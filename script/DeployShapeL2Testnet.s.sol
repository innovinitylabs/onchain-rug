// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugsV2Shape.sol";

/**
 * @title DeployShapeL2Testnet
 * @dev Deploy OnchainRugsV2Shape to Shape L2 testnet
 */
contract DeployShapeL2Testnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying OnchainRugsV2Shape to Shape L2 Testnet...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        console.log("Network: Shape L2 Testnet (Chain ID: 11011)");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        OnchainRugsV2Shape onchainRugs = new OnchainRugsV2Shape();

        console.log("OnchainRugsV2Shape deployed at:", address(onchainRugs));
        console.log("Contract name:", onchainRugs.name());
        console.log("Contract symbol:", onchainRugs.symbol());
        console.log("Max supply:", onchainRugs.maxSupply());

        vm.stopBroadcast();

        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "Shape L2 Testnet Deployment Info:\n",
            "Contract Address: ", vm.toString(address(onchainRugs)), "\n",
            "Deployer: ", vm.toString(deployer), "\n",
            "Network: Shape L2 Testnet (Chain ID: 11011)\n",
            "RPC URL: https://sepolia.shape.network\n",
            "Block Explorer: https://explorer-sepolia.shape.network\n",
            "Max Supply: 1111\n",
            "Base Price: 0.0001 ETH\n",
            "Text Line Price: 0.00111 ETH\n",
            "Cleaning Cost: 0.0001 ETH\n",
            "Laundering Cost: 0.0005 ETH\n"
        ));

        console.log(deploymentInfo);

        // Write to file for easy reference
        vm.writeFile("shape-l2-testnet-deployment.txt", deploymentInfo);
        console.log("Deployment info saved to shape-l2-testnet-deployment.txt");
    }
}
