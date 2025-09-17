// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/RugScriptyBuilderV2.sol";
import "../src/RugEthFSStorage.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/OnchainRugs.sol";

/**
 * @title DeployRugScriptyLocal
 * @dev Deploy the complete Rug Scripty system locally
 */
contract DeployRugScriptyLocal is Script {
    function run() external {
        // Use the first account from Anvil (has 10000 ETH)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Complete Rug Scripty System...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        console.log("Network: Local Anvil (Chain ID: 31337)");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================================================
        // 1. DEPLOY CORE SCRIPPY CONTRACTS
        // ============================================================================

        console.log("\nStep 1: Deploying RugScriptyBuilderV2...");
        RugScriptyBuilderV2 rugScriptyBuilder = new RugScriptyBuilderV2();
        console.log("RugScriptyBuilderV2 deployed at:", address(rugScriptyBuilder));

        console.log("\nStep 2: Deploying RugEthFSStorage...");
        RugEthFSStorage rugEthFSStorage = new RugEthFSStorage();
        console.log("RugEthFSStorage deployed at:", address(rugEthFSStorage));

        console.log("\nStep 3: Deploying OnchainRugsHTMLGenerator...");
        OnchainRugsHTMLGenerator htmlGenerator = new OnchainRugsHTMLGenerator();
        console.log("OnchainRugsHTMLGenerator deployed at:", address(htmlGenerator));

        // ============================================================================
        // 2. DEPLOY ONCHAINRUGS CONTRACT
        // ============================================================================

        console.log("\nStep 4: Deploying OnchainRugs...");
        OnchainRugs onchainRugs = new OnchainRugs();
        console.log("OnchainRugs deployed at:", address(onchainRugs));

        vm.stopBroadcast();

        // ============================================================================
        // 3. SETUP CONTRACT RELATIONSHIPS
        // ============================================================================

        console.log("\nStep 5: Setting up contract relationships...");

        // Set the Rug Scripty contracts in OnchainRugs
        vm.startBroadcast(deployerPrivateKey);
        onchainRugs.setRugScriptyContracts(
            address(rugScriptyBuilder),
            address(rugEthFSStorage),
            address(htmlGenerator)
        );
        vm.stopBroadcast();

        console.log("OnchainRugs configured with Rug Scripty system");

        // ============================================================================
        // 4. DEPLOYMENT SUMMARY
        // ============================================================================

        string memory deploymentInfo = string(abi.encodePacked(
            "========================================\n",
            "RUG SCRIPPY SYSTEM DEPLOYMENT COMPLETE!\n",
            "========================================\n\n",
            "Core Contracts:\n",
            "- RugScriptyBuilderV2: ", vm.toString(address(rugScriptyBuilder)), "\n",
            "- RugEthFSStorage: ", vm.toString(address(rugEthFSStorage)), "\n",
            "- OnchainRugsHTMLGenerator: ", vm.toString(address(htmlGenerator)), "\n\n",
            "NFT Contract:\n",
            "- OnchainRugs: ", vm.toString(address(onchainRugs)), "\n\n",
            "Network: Local Anvil (Chain ID: 31337)\n",
            "RPC URL: http://localhost:8545\n",
            "Deployer: ", vm.toString(deployer), "\n\n",
            "NEXT STEPS:\n",
            "1. Upload p5.js to RugEthFSStorage\n",
            "2. Upload rug-algorithm.js to RugEthFSStorage\n",
            "3. Mint NFTs - they'll use the new on-chain system!\n\n",
            "SYSTEM ARCHITECTURE:\n",
            "- RugScriptyBuilderV2 (Core HTML assembler)\n",
            "- RugEthFSStorage (Stores p5.js + algorithms)\n",
            "- OnchainRugsHTMLGenerator (Project-specific logic)\n",
            "- OnchainRugs (NFT contract using the system)\n"
        ));

        console.log(deploymentInfo);

        // Save to file
        vm.writeFile("rug-scripty-deployment-local.txt", deploymentInfo);
        console.log("Deployment info saved to rug-scripty-deployment-local.txt");

        // Also save contract addresses for easy reference
        string memory addresses = string(abi.encodePacked(
            "Contract Addresses:\n",
            "RUG_SCRIPPY_BUILDER=", vm.toString(address(rugScriptyBuilder)), "\n",
            "RUG_ETHFS_STORAGE=", vm.toString(address(rugEthFSStorage)), "\n",
            "HTML_GENERATOR=", vm.toString(address(htmlGenerator)), "\n",
            "ONCHAIN_RUGS=", vm.toString(address(onchainRugs)), "\n"
        ));

        vm.writeFile("rug-scripty-addresses.env", addresses);
        console.log("Contract addresses saved to rug-scripty-addresses.env");
    }
}
