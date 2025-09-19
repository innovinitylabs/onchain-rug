// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title UploadLibrariesUniversal
 * @dev Upload JavaScript libraries to ScriptyStorageV2 (works on any network)
 */
contract UploadLibrariesUniversal is Script {
    function run() external {
        uint256 deployerPrivateKey;
        address scriptyStorageAddr;
        string memory networkName;

        // Detect environment
        if (block.chainid == 31337) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
            networkName = "Local Anvil";
            // Load from local deployment file
            scriptyStorageAddr = vm.envAddress("RUG_SCRIPTY_STORAGE");
        } else if (block.chainid == 11011) {
            deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
            networkName = "Shape L2 Testnet";
            scriptyStorageAddr = vm.envAddress("RUG_SCRIPTY_STORAGE");
        } else {
            revert("Unsupported network");
        }

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== UPLOADING JAVASCRIPT LIBRARIES ===");
        console.log("Network:", networkName);
        console.log("Deployer:", deployer);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Upload p5.js.b64
        console.log("\nUploading p5.js.b64...");
        string memory p5Content = vm.readFile("data/rug-p5.js.b64");
        storageContract.createContent("rug-p5.js.b64", bytes(p5Content));
        console.log("p5.js.b64 uploaded successfully");

        // Upload rug-algorithm.js.b64
        console.log("\nUploading rug-algorithm.js.b64...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js.b64");
        storageContract.createContent("rug-algorithm.js.b64", bytes(algoContent));
        console.log("rug-algorithm.js.b64 uploaded successfully");

        // Freeze the libraries
        console.log("\nFreezing libraries...");
        storageContract.freezeContent("rug-p5.js.b64");
        storageContract.freezeContent("rug-algorithm.js.b64");
        console.log("Libraries frozen successfully");

        vm.stopBroadcast();

        console.log("\n=== UPLOAD COMPLETE ===");
        console.log("JavaScript libraries are now stored on-chain with SSTORE2 chunking!");
        console.log("Ready for NFT minting and HTML generation.");

        // Show storage info
        console.log("\nStorage Information:");
        console.log("Network:", networkName);
        console.log("SSTORE2 Chunking: ENABLED");
        console.log("Gas Efficiency: OPTIMIZED");
        console.log("Libraries uploaded successfully");
    }
}
