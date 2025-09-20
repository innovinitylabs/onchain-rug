// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/dependencies/ethfs/FileStore.sol";

/**
 * @title DeployFileStore
 * @dev Deploy FileStore contract for EthFS system
 * @notice Requires Create2Deployer to be deployed first
 */
contract DeployFileStore is Script {
    function run() external {
        // Use local anvil private key
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== DEPLOYING FILESTORE ===");
        console.log("Network: Local Anvil");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        // Read Create2Deployer address from deployment file
        string memory create2DeployerInfo = vm.readFile("create2deployer-deployment.txt");
        address create2DeployerAddr;

        // Parse the address from the deployment file
        string[] memory lines = vm.split(create2DeployerInfo, "\n");
        for (uint i = 0; i < lines.length; i++) {
            if (vm.contains(lines[i], "Address:")) {
                // Extract address from "Address: 0x..." format
                bytes memory lineBytes = bytes(lines[i]);
                bytes memory addrBytes = new bytes(42); // 0x + 40 hex chars
                for (uint j = 0; j < 42; j++) {
                    addrBytes[j] = lineBytes[j + 10]; // Skip "- Address: "
                }
                create2DeployerAddr = vm.parseAddress(string(addrBytes));
                break;
            }
        }

        require(create2DeployerAddr != address(0), "Create2Deployer address not found in deployment file");

        console.log("Using Create2Deployer at:", create2DeployerAddr);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy FileStore with Create2Deployer
        FileStore fileStore = new FileStore(create2DeployerAddr);

        vm.stopBroadcast();

        console.log("");
        console.log("FileStore deployed at:", address(fileStore));
        console.log("Create2Deployer used:", create2DeployerAddr);

        // Save deployment info
        string memory deploymentInfo = string(abi.encodePacked(
            "FileStore Deployment:\n",
            "- Address: ", vm.toString(address(fileStore)), "\n",
            "- Create2Deployer: ", vm.toString(create2DeployerAddr), "\n",
            "- Network: Local Anvil\n",
            "- Chain ID: ", vm.toString(block.chainid), "\n",
            "- Deployer: ", vm.toString(deployer), "\n"
        ));

        vm.writeFile("filestore-deployment.txt", deploymentInfo);
        console.log("Deployment info saved to filestore-deployment.txt");

        console.log("\n*** FILESTORE SUCCESSFULLY DEPLOYED! ***");
        console.log("EthFS system is now ready for Scripty contracts");
    }
}
