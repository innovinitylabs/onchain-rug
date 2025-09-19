// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadRugP5 is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading ultra-minimal rug-p5.js.gz (base64) to ScriptyStorageV2...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use your deployed ScriptyStorageV2 address
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xc6e7DF5E7b4f2A278906862b61205850344D4e7d);
        
        // Read gzipped base64 content
        string memory rugP5GzContent = vm.readFile("data/rug-p5.js.gz.b64");
        console.log("File size:", bytes(rugP5GzContent).length, "bytes");
        
        // Create content entry (cheap operation)
        storageContract.createContent("rug-p5.js.gz", bytes("Ultra-minimal p5.js shim for rug visualization"));
        
        // Convert string to bytes for chunking
        bytes memory contentBytes = bytes(rugP5GzContent);
        
        // Split into chunks (24KB each)
        uint256 chunkSize = 24575;
        uint256 contentLength = contentBytes.length;
        uint256 numChunks = (contentLength + chunkSize - 1) / chunkSize;
        
        console.log("Total chunks needed:", numChunks);
        
        // Upload each chunk in separate transactions
        for (uint256 i = 0; i < numChunks; i++) {
            uint256 start = i * chunkSize;
            uint256 end = start + chunkSize > contentLength ? contentLength : start + chunkSize;
            
            // Extract chunk
            bytes memory chunk = new bytes(end - start);
            for (uint256 j = start; j < end; j++) {
                chunk[j - start] = contentBytes[j];
            }
            
            // Upload chunk (each transaction ~10K gas)
            storageContract.addChunkToContent("rug-p5.js.gz", chunk);
            console.log("Uploaded chunk", i + 1, "/", numChunks);
        }
        
        // Freeze content to prevent further modifications
        storageContract.freezeContent("rug-p5.js.gz");
        
        vm.stopBroadcast();
        
        console.log("rug-p5.js.gz uploaded successfully!");
        console.log("Size reduction: 12KB to 3.4KB gzipped (72% smaller!)");
    }
}
