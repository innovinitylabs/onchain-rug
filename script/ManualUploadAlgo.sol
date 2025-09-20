// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract ManualUploadAlgo is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        // Hardcoded ScriptyStorage address
        address scriptyStorageAddr = 0x2263cf7764c19070b6fCE6E8B707f2bDc35222C9;

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== UPLOADING ALGORITHM LIBRARY ===");
        console.log("Deployer:", deployer);
        console.log("ScriptyStorage:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Read the algorithm b64 file
        string memory algoContent = vm.readFile("data/onchainrugs.js.b64");

        console.log("Algorithm content length:", bytes(algoContent).length);

        // Create content in ScriptyStorage
        console.log("Creating content for onchainrugs.js.b64...");
        storageContract.createContent("onchainrugs.js.b64", "Algorithm library for OnchainRugs");

        // Add the chunk
        console.log("Adding chunk to onchainrugs.js.b64...");
        storageContract.addChunkToContent("onchainrugs.js.b64", bytes(algoContent));

        console.log("✅ Algorithm library uploaded successfully!");
        console.log("Library name: onchainrugs.js.b64");

        vm.stopBroadcast();
    }
}
