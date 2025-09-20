// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/dependencies/ethfs/Create2Deployer.sol";

/**
 * @title DeployCreate2Deployer
 * @dev Deploy Create2Deployer contract for EthFS system
 */
contract DeployCreate2Deployer is Script {
    function run() external {
        // Use local anvil private key
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== DEPLOYING CREATE2DEPLOYER ===");
        console.log("Network: Local Anvil");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Create2Deployer
        Create2Deployer create2Deployer = new Create2Deployer();

        vm.stopBroadcast();

        console.log("");
        console.log("Create2Deployer deployed at:", address(create2Deployer));

        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "Create2Deployer Deployment:\n",
            "- Address: ", vm.toString(address(create2Deployer)), "\n",
            "- Network: Local Anvil\n",
            "- Chain ID: ", vm.toString(block.chainid), "\n",
            "- Deployer: ", vm.toString(deployer), "\n"
        ));

        vm.writeFile("create2deployer-deployment.txt", deploymentInfo);
        console.log("Deployment info saved to create2deployer-deployment.txt");

        console.log("\n*** CREATE2DEPLOYER SUCCESSFULLY DEPLOYED! ***");
        console.log("Use this address for FileStore deployment");
    }
}
