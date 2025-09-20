// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract ManualUploadP5 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        // Hardcoded ScriptyStorage address
        address scriptyStorageAddr = 0x2263cf7764c19070b6fCE6E8B707f2bDc35222C9;

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== UPLOADING P5.JS LIBRARY ===");
        console.log("Deployer:", deployer);
        console.log("ScriptyStorage:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Read the p5.js b64 file
        string memory p5Content = vm.readFile("data/onchainrugs-p5.js.b64");

        console.log("P5.js content length:", bytes(p5Content).length);

        // Create content in ScriptyStorage
        console.log("Creating content for onchainrugs-p5.js.b64...");
        storageContract.createContent("onchainrugs-p5.js.b64", "P5.js library for OnchainRugs");

        // Add the chunk
        console.log("Adding chunk to onchainrugs-p5.js.b64...");
        storageContract.addChunkToContent("onchainrugs-p5.js.b64", bytes(p5Content));

        console.log("✅ P5.js library uploaded successfully!");
        console.log("Library name: onchainrugs-p5.js.b64");

        vm.stopBroadcast();
    }
}
