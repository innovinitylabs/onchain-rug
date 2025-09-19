// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title UploadLibraries
 * @dev Upload p5.js and rug-algorithm.js to ScriptyStorageV2 with automatic chunking
 */
contract UploadLibraries is Script {
    function run() external {
        // Use the first account from Anvil
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Uploading JavaScript libraries to ScriptyStorageV2...");
        console.log("Deployer:", deployer);
        console.log("EthFS FileStore: 0xFe1411d6864592549AdE050215482e4385dFa0FB");

        vm.startBroadcast(deployerPrivateKey);

        // ScriptyStorageV2 contract (replace with your deployed address)
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);

        // Upload p5.js (will be automatically chunked by ScriptyStorageV2)
        console.log("\nUploading rug-p5.js...");
        string memory p5Content = vm.readFile("data/rug-p5.js");
        storageContract.createContent("rug-p5.js", bytes(p5Content));
        console.log("rug-p5.js uploaded successfully (automatically chunked)");

        // Upload rug-algorithm.js
        console.log("\nUploading rug-algorithm.js...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js");
        storageContract.createContent("rug-algorithm.js", bytes(algoContent));
        console.log("rug-algorithm.js uploaded successfully");

        vm.stopBroadcast();

        console.log("\nAll libraries uploaded successfully!");
        console.log("You can now mint NFTs with the new on-chain system!");
        console.log("\nNote: Files are automatically chunked and stored efficiently in ScriptyStorageV2");
    }
}
