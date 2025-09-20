// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadLibraries is Script {
    ScriptyStorageV2 public scriptyStorage;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Uploading JavaScript libraries to Scripty storage...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        // Use the existing Scripty storage address
        scriptyStorage = ScriptyStorageV2(payable(0x2263cf7764c19070b6fCE6E8B707f2bDc35222C9));

        // Upload p5.js library
        console.log("Uploading p5.js...");
        uploadLibrary("onchainrugs-p5.js.b64", "./data/rug-p5.js.b64");

        // Upload algorithm library
        console.log("Uploading algorithm...");
        uploadLibrary("onchainrugs.js.b64", "./data/rug-algo.js.b64");

        vm.stopBroadcast();

        console.log("Libraries uploaded successfully!");
    }

    function uploadLibrary(string memory name, string memory filePath) internal {
        // Read the file
        string memory content = vm.readFile(filePath);
        bytes memory contentBytes = bytes(content);

        console.log("File:", name);
        console.log("Size:", contentBytes.length, "bytes");

        // Split into 20KB chunks
        uint256 chunkSize = 20000;
        uint256 totalChunks = (contentBytes.length + chunkSize - 1) / chunkSize;
        console.log("Chunks:", totalChunks);

        // Create the content
        scriptyStorage.createContent(name, "");

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

            scriptyStorage.addChunkToContent(name, chunk);
            console.log("Uploaded chunk", i + 1, "/", totalChunks);
        }

        // Freeze the content
        scriptyStorage.freezeContent(name);
        console.log("Content frozen:", name);
    }
}
