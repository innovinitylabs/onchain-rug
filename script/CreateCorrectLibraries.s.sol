// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title CreateCorrectLibraries
 * @dev Create libraries with the exact names expected by Scripty system
 */
contract CreateCorrectLibraries is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address scriptyStorageAddr = vm.envAddress("SCRIPTY_STORAGE_V2");

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== CREATING CORRECT LIBRARIES ===");
        console.log("Deployer:", deployer);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Create libraries with the exact names expected by Scripty
        console.log("\nCreating p5.min.js.gz...");
        string memory p5Content = vm.readFile("data/rug-p5.js.b64");
        storageContract.createContent("p5.min.js.gz", "p5.js library for OnchainRugs");
        storageContract.addChunkToContent("p5.min.js.gz", bytes(p5Content));
        storageContract.freezeContent("p5.min.js.gz");

        console.log("\nCreating rug-algorithm.js...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js.b64");
        storageContract.createContent("rug-algorithm.js", "Algorithm library for OnchainRugs");
        storageContract.addChunkToContent("rug-algorithm.js", bytes(algoContent));
        storageContract.freezeContent("rug-algorithm.js");

        // Submit to EthFS
        console.log("\nSubmitting to EthFS...");
        storageContract.submitToEthFSFileStore("p5.min.js.gz", "");
        storageContract.submitToEthFSFileStore("rug-algorithm.js", "");

        vm.stopBroadcast();

        console.log("\n=== SUCCESS! ===");
        console.log("Libraries created with correct names!");
        console.log("p5.min.js.gz and rug-algorithm.js are now available.");
    }
}
