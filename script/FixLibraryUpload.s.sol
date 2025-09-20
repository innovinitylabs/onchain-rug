// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title FixLibraryUpload
 * @dev Fix incomplete library uploads by checking state and completing missing steps
 */
contract FixLibraryUpload is Script {
    function run() external {
        uint256 deployerPrivateKey;
        address scriptyStorageAddr;
        string memory networkName;

        // Detect environment
        if (block.chainid == 31337) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
            networkName = "Local Anvil";
            scriptyStorageAddr = vm.envAddress("SCRIPTY_STORAGE_V2");
        } else if (block.chainid == 11011) {
            deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
            networkName = "Shape L2 Testnet";
            scriptyStorageAddr = vm.envAddress("SCRIPTY_STORAGE_V2");
        } else {
            revert("Unsupported network");
        }

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== FIXING LIBRARY UPLOADS ===");
        console.log("Network:", networkName);
        console.log("Deployer:", deployer);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Check and fix p5.js.b64
        fixLibrary(storageContract, "rug-p5.js.b64", "data/rug-p5.js.b64", "p5.js library for OnchainRugs");

        // Check and fix rug-algorithm.js.b64
        fixLibrary(storageContract, "rug-algorithm.js.b64", "data/rug-algorithm.js.b64", "Algorithm library for OnchainRugs");

        vm.stopBroadcast();

        console.log("\n=== FIX COMPLETE ===");
        console.log("Libraries should now be properly uploaded and available!");
    }

    function fixLibrary(
        ScriptyStorageV2 storageContract,
        string memory name,
        string memory filePath,
        string memory description
    ) internal {
        console.log(string.concat("\nChecking ", name, "..."));

        // Check if content exists by getting chunk count
        address[] memory chunks = storageContract.getContentChunkPointers(name);

        if (chunks.length == 0) {
            console.log("Content doesn't exist or has no chunks, creating...");
            string memory content = vm.readFile(filePath);
            storageContract.createContent(name, bytes(description));
            storageContract.addChunkToContent(name, bytes(content));
            storageContract.freezeContent(name);
            console.log("Content created, chunk added, and frozen");
        } else {
            console.log(string.concat("Content exists with ", vm.toString(chunks.length), " chunks"));

            // Try to add chunks anyway (will fail if already added or frozen)
            string memory content = vm.readFile(filePath);
            storageContract.addChunkToContent(name, bytes(content));
            console.log("Chunks added (or already existed)");
        }

        // Submit to EthFS
        console.log("Submitting to EthFS FileStore...");
        storageContract.submitToEthFSFileStore(name, "");
        console.log("Successfully submitted to EthFS");
    }
}
