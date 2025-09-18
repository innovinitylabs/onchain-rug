// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/ethfs/IFileStore.sol";

/**
 * @title UploadLibraries
 * @dev Upload p5.js and rug-algorithm.js directly to EthFS FileStore with automatic chunking
 */
contract UploadLibraries is Script {
    function run() external {
        // Use the first account from Anvil
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Uploading JavaScript libraries to EthFS FileStore...");
        console.log("Deployer:", deployer);
        console.log("EthFS FileStore: 0xFe1411d6864592549AdE050215482e4385dFa0FB");

        vm.startBroadcast(deployerPrivateKey);

        // EthFS FileStore contract (same address on all networks)
        IFileStore fileStore = IFileStore(0xFe1411d6864592549AdE050215482e4385dFa0FB);

        // Upload p5.js (will be automatically chunked by EthFS)
        console.log("\nUploading p5.js...");
        string memory p5Content = vm.readFile("data/p5.min.js");
        fileStore.createFile("p5.min.js", p5Content);
        console.log("p5.js uploaded successfully (automatically chunked)");

        // Upload rug-algorithm.js
        console.log("\nUploading rug-algorithm.js...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js");
        fileStore.createFile("rug-algorithm.js", algoContent);
        console.log("rug-algorithm.js uploaded successfully");

        vm.stopBroadcast();

        // Verify uploads
        console.log("\nVerifying uploads...");
        bool p5Exists = fileStore.fileExists("p5.min.js");
        bool algoExists = fileStore.fileExists("rug-algorithm.js");

        console.log("p5.min.js exists:", p5Exists);
        console.log("rug-algorithm.js exists:", algoExists);

        if (p5Exists && algoExists) {
            console.log("\nAll libraries uploaded successfully!");
            console.log("You can now mint NFTs with the new on-chain system!");
            console.log("\nNote: p5.js was automatically split into ~50 chunks of ~24KB each");
        } else {
            console.log("\nSome uploads failed!");
        }
    }
}
