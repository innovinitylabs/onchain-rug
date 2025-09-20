// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title CheckAndFix
 * @dev Check current state and create new libraries if frozen ones have no data
 */
contract CheckAndFix is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        // Hardcoded addresses
        address scriptyStorageAddr = 0x2263cf7764c19070b6fCE6E8B707f2bDc35222C9;

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== CHECKING LIBRARY STATE ===");
        console.log("Deployer:", deployer);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Check current state
        checkLibraryState(storageContract, "rug-p5.js.b64");
        checkLibraryState(storageContract, "rug-algorithm.js.b64");

        // If frozen but no data, create new versions
        createNewIfNeeded(storageContract, "rug-p5.js.b64", "data/rug-p5.js.b64");
        createNewIfNeeded(storageContract, "rug-algorithm.js.b64", "data/rug-algorithm.js.b64");

        vm.stopBroadcast();

        console.log("\n=== CHECK COMPLETE ===");
    }

    function checkLibraryState(ScriptyStorageV2 storageContract, string memory name) internal {
        console.log(string.concat("\nChecking ", name, "..."));

        address[] memory chunks = storageContract.getContentChunkPointers(name);

        if (chunks.length == 0) {
            console.log("ERROR: No chunks found - library has no data");
        } else {
            console.log(string.concat("OK: Has ", vm.toString(chunks.length), " chunks"));

            // Try to get content
            bytes memory content = storageContract.getContent(name, "");
            console.log(string.concat("OK: Content retrieved, size: ", vm.toString(content.length)));
        }
    }

    function createNewIfNeeded(
        ScriptyStorageV2 storageContract,
        string memory name,
        string memory filePath
    ) internal {
        address[] memory chunks = storageContract.getContentChunkPointers(name);

        if (chunks.length == 0) {
            console.log(string.concat("\nCreating new version of ", name, "..."));

            // Create with new name to avoid frozen content
            string memory newName = string.concat(name, "_v2");

            string memory content = vm.readFile(filePath);
            storageContract.createContent(newName, "Updated library");
            storageContract.addChunkToContent(newName, bytes(content));
            storageContract.freezeContent(newName);

            // Submit to EthFS
            storageContract.submitToEthFSFileStore(newName, "");

            console.log(string.concat("SUCCESS: Created ", newName, " successfully"));
        }
    }
}
