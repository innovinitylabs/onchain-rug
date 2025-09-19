// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/OnchainRugs.sol";

/**
 * @title DeployRugScriptyShapeTestnet
 * @dev Deploy complete RugScripty system to Shape L2 testnet
 */
contract DeployRugScriptyShapeTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== DEPLOYING RUG SCRIPPY SYSTEM TO SHAPE TESTNET ===");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        console.log("Network: Shape L2 Testnet (Chain ID: 11011)");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================================================
        // 1. DEPLOY CORE RUG SCRIPPY CONTRACTS
        // ============================================================================

        console.log("\n1. Deploying ScriptyBuilderV2...");
        ScriptyBuilderV2 scriptyBuilder = new ScriptyBuilderV2();
        console.log("ScriptyBuilderV2 deployed at:", address(scriptyBuilder));

        console.log("\n2. Deploying ScriptyStorageV2...");
        // EthFS FileStore address (same across all networks)
        address ethfsFileStoreAddr = 0xFe1411d6864592549AdE050215482e4385dFa0FB;
        ScriptyStorageV2 scriptyStorage = new ScriptyStorageV2(IFileStore(ethfsFileStoreAddr));
        console.log("ScriptyStorageV2 deployed at:", address(scriptyStorage));

        console.log("\n3. Deploying OnchainRugsHTMLGenerator...");
        OnchainRugsHTMLGenerator htmlGenerator = new OnchainRugsHTMLGenerator();
        console.log("OnchainRugsHTMLGenerator deployed at:", address(htmlGenerator));

        console.log("\n4. Deploying OnchainRugs...");
        OnchainRugs onchainRugs = new OnchainRugs();
        console.log("OnchainRugs deployed at:", address(onchainRugs));

        // ============================================================================
        // 2. SETUP CONTRACT RELATIONSHIPS
        // ============================================================================

        console.log("\n5. Setting up contract relationships...");
        onchainRugs.setRugScriptyContracts(
            address(scriptyBuilder),
            address(scriptyStorage),
            address(htmlGenerator)
        );
        console.log("Contract relationships established!");

        vm.stopBroadcast();

        // ============================================================================
        // 3. DEPLOYMENT SUMMARY
        // ============================================================================

        string memory deploymentInfo = string(abi.encodePacked(
            "========================================\n",
            "RUG SCRIPPY SYSTEM - SHAPE TESTNET DEPLOYMENT\n",
            "========================================\n\n",
            "Network: Shape L2 Testnet (Chain ID: 11011)\n",
            "RPC URL: https://sepolia.shape.network\n",
            "Block Explorer: https://explorer-sepolia.shape.network\n\n",
            "Core Contracts:\n",
            "- ScriptyBuilderV2: ", vm.toString(address(scriptyBuilder)), "\n",
            "- ScriptyStorageV2: ", vm.toString(address(scriptyStorage)), "\n",
            "- OnchainRugsHTMLGenerator: ", vm.toString(address(htmlGenerator)), "\n\n",
            "NFT Contract:\n",
            "- OnchainRugs: ", vm.toString(address(onchainRugs)), "\n\n",
            "EthFS FileStore: ", vm.toString(ethfsFileStoreAddr), "\n\n",
            "NEXT STEPS:\n",
            "1. Upload p5.js: forge script script/UploadToRugScriptyStorage.s.sol --rpc-url https://sepolia.shape.network --broadcast\n",
            "2. Upload rug-algorithm.js: same script\n",
            "3. Mint NFTs: Use the deployed OnchainRugs contract\n\n",
            "VERIFICATION:\n",
            "forge verify-contract ", vm.toString(address(scriptyBuilder)), " src/scripty/ScriptyBuilderV2.sol:ScriptyBuilderV2 --chain 11011\n",
            "forge verify-contract ", vm.toString(address(scriptyStorage)), " src/scripty/ScriptyStorageV2.sol:ScriptyStorageV2 --chain 11011\n",
            "forge verify-contract ", vm.toString(address(htmlGenerator)), " src/OnchainRugsHTMLGenerator.sol:OnchainRugsHTMLGenerator --chain 11011\n",
            "forge verify-contract ", vm.toString(address(onchainRugs)), " src/OnchainRugs.sol:OnchainRugs --chain 11011\n"
        ));

        console.log(deploymentInfo);

        // Save deployment info to file
        vm.writeFile("rug-scripty-shape-testnet-deployment.txt", deploymentInfo);
        console.log("Deployment info saved to rug-scripty-shape-testnet-deployment.txt");

        // Save contract addresses for easy reference
        string memory addresses = string(abi.encodePacked(
            "# RugScripty Shape Testnet Addresses\n",
            "RUG_SCRIPPY_BUILDER=", vm.toString(address(scriptyBuilder)), "\n",
            "SCRIPTY_STORAGE_V2=", vm.toString(address(scriptyStorage)), "\n",
            "HTML_GENERATOR=", vm.toString(address(htmlGenerator)), "\n",
            "ONCHAIN_RUGS=", vm.toString(address(onchainRugs)), "\n",
            "ETHFS_FILESTORE=", vm.toString(ethfsFileStoreAddr), "\n"
        ));

        vm.writeFile("rug-scripty-shape-testnet.env", addresses);
        console.log("Contract addresses saved to rug-scripty-shape-testnet.env");

        console.log("\n*** RUG SCRIPPY SYSTEM SUCCESSFULLY DEPLOYED TO SHAPE TESTNET! ***");
        console.log("Ready for JavaScript library uploads and NFT minting!");
    }
}
