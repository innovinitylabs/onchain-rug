// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

/**
 * @title DeployLocal
 * @dev Deploy OnchainRugsV2Shape to local Anvil network
 */
contract DeployLocal is Script {
    function run() external {
        // Use the first account from Anvil (has 10000 ETH)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying OnchainRugsV2Shape to local network...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        console.log("Network: Local Anvil (Chain ID: 31337)");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        OnchainRugs onchainRugs = new OnchainRugs();

        console.log("OnchainRugsV2Shape deployed at:", address(onchainRugs));
        console.log("Contract name:", onchainRugs.name());
        console.log("Contract symbol:", onchainRugs.symbol());
        console.log("Max supply:", onchainRugs.maxSupply());

        vm.stopBroadcast();

        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "Local Deployment Info:\n",
            "Contract Address: ", vm.toString(address(onchainRugs)), "\n",
            "Deployer: ", vm.toString(deployer), "\n",
            "Network: Local Anvil (Chain ID: 31337)\n",
            "RPC URL: http://localhost:8545\n",
            "Max Supply: 1111\n",
            "Base Price: 0.0001 ETH\n",
            "Text Line Price: 0.00111 ETH\n",
            "Cleaning Cost: 0.0001 ETH\n",
            "Laundering Cost: 0.0005 ETH\n"
        ));

        console.log(deploymentInfo);

        // Write to file for easy reference
        vm.writeFile("local-deployment.txt", deploymentInfo);
        console.log("Deployment info saved to local-deployment.txt");
    }
}
