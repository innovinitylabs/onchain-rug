// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadLibraries is Script {
    // Deployed contract addresses from Shape Sepolia
    address constant SCRIPTY_STORAGE = 0x4Ce6c6BdBd0d5a9DfF39f82C1892F02b98fBdbA8;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 scriptyStorage = ScriptyStorageV2(SCRIPTY_STORAGE);

        console.log("=========================================");
        console.log("Uploading JavaScript libraries to ScriptyStorage");
        console.log("=========================================");

        // Upload rug-p5.js
        console.log("Uploading rug-p5.js...");
        string memory p5Content = vm.readFile("data/rug-p5.js");
        uploadFile(scriptyStorage, "rug-p5.js", p5Content);

        // Upload rug-algo.js
        console.log("Uploading rug-algo.js...");
        string memory algoContent = vm.readFile("data/rug-algo.js");
        uploadFile(scriptyStorage, "rug-algo.js", algoContent);

        // Upload rug-frame.js
        console.log("Uploading rug-frame.js...");
        string memory frameContent = vm.readFile("data/rug-frame.js");
        uploadFile(scriptyStorage, "rug-frame.js", frameContent);

        console.log("=========================================");
        console.log("All libraries uploaded successfully!");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function uploadFile(ScriptyStorageV2 scriptyStorage, string memory fileName, string memory content) internal {
        bytes memory contentBytes = bytes(content);

        // Split into 20KB chunks
        uint256 chunkSize = 20000; // 20KB chunks
        uint256 totalChunks = (contentBytes.length + chunkSize - 1) / chunkSize;

        console.log("   File:", fileName);
        console.log("   Size:", contentBytes.length, "bytes");
        console.log("   Chunks:", totalChunks);

        // Create the content in ScriptyStorage
        scriptyStorage.createContent(fileName, "");

        // Upload chunks
        for (uint256 i = 0; i < totalChunks; i++) {
            uint256 start = i * chunkSize;
            uint256 end = start + chunkSize;
            if (end > contentBytes.length) {
                end = contentBytes.length;
            }

            bytes memory chunk = new bytes(end - start);
            for (uint256 j = start; j < end; j++) {
                chunk[j - start] = contentBytes[j];
            }

            scriptyStorage.addChunkToContent(fileName, chunk);
            console.log("   Uploaded chunk", i + 1, "/", totalChunks);
        }

        console.log("   File uploaded successfully");
    }
}
