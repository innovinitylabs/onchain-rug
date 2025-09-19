// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title UploadToRugScriptyShapeTestnet
 * @dev Upload p5.js and rug-algorithm.js to RugScriptyContractStorage on Shape testnet
 */
contract UploadToRugScriptyShapeTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== UPLOADING JAVASCRIPT LIBRARIES TO SHAPE TESTNET ===");
        console.log("Deployer:", deployer);
        console.log("Network: Shape L2 Testnet");

        vm.startBroadcast(deployerPrivateKey);

        // Get the RugScriptyContractStorage address from environment or deployment file
        address rugScriptyStorageAddr = vm.envOr("RUG_SCRIPTY_STORAGE", address(0));

        // If not set, try to read from deployment file
        if (rugScriptyStorageAddr == address(0)) {
            string memory envFile = vm.readFile("rug-scripty-shape-testnet.env");
            // Parse the RUG_SCRIPTY_STORAGE line
            string[] memory lines = vm.split(envFile, "\n");
            for (uint256 i = 0; i < lines.length; i++) {
                if (vm.contains(lines[i], "RUG_SCRIPTY_STORAGE=")) {
                    string memory addrStr = vm.replace(lines[i], "RUG_SCRIPTY_STORAGE=", "");
                    rugScriptyStorageAddr = vm.parseAddress(addrStr);
                    break;
                }
            }
        }

        require(rugScriptyStorageAddr != address(0), "RUG_SCRIPTY_STORAGE not found. Set env var or check rug-scripty-shape-testnet.env");

        ScriptyStorageV2 storageContract = ScriptyStorageV2(rugScriptyStorageAddr);
        console.log("ScriptyStorageV2:", rugScriptyStorageAddr);

        // Upload p5.js
        console.log("\nUploading rug-p5.js...");
        string memory p5Content = vm.readFile("data/rug-p5.js");
        storageContract.createContent("rug-p5.js", bytes(p5Content));
        console.log("rug-p5.js content created successfully");

        bytes memory p5Bytes = bytes(p5Content);
        uint256 chunkSize = 24575; // Max SSTORE2 size
        console.log("Uploading p5.js chunks...");
        for (uint256 i = 0; i < p5Bytes.length; i += chunkSize) {
            uint256 end = i + chunkSize > p5Bytes.length ? p5Bytes.length : i + chunkSize;
            bytes memory chunk = new bytes(end - i);
            for (uint256 j = i; j < end; j++) {
                chunk[j - i] = p5Bytes[j];
            }
            storageContract.addChunkToContent("rug-p5.js", chunk);
            console.log("Uploaded p5.js chunk", i / chunkSize + 1);
        }

        // Upload algorithm
        console.log("\nUploading rug-algorithm.js...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js");
        storageContract.createContent("rug-algorithm.js", bytes(algoContent));
        console.log("rug-algorithm.js content created successfully");

        bytes memory algoBytes = bytes(algoContent);
        console.log("Uploading algorithm chunks...");
        for (uint256 i = 0; i < algoBytes.length; i += chunkSize) {
            uint256 end = i + chunkSize > algoBytes.length ? algoBytes.length : i + chunkSize;
            bytes memory chunk = new bytes(end - i);
            for (uint256 j = i; j < end; j++) {
                chunk[j - i] = algoBytes[j];
            }
            storageContract.addChunkToContent("rug-algorithm.js", chunk);
            console.log("Uploaded algorithm chunk", i / chunkSize + 1);
        }

        // Freeze content
        console.log("\nFreezing content...");
        storageContract.freezeContent("rug-p5.js");
        storageContract.freezeContent("rug-algorithm.js");
        console.log("Content frozen successfully");

        vm.stopBroadcast();

        console.log("\n=== UPLOAD COMPLETE! ===");
        console.log("[SUCCESS] rug-p5.js uploaded and frozen");
        console.log("[SUCCESS] rug-algorithm.js uploaded and frozen");
        console.log("*** Ready for NFT minting on Shape testnet! ***");

        // Verify content is accessible
        console.log("\nVerifying uploaded content...");

        vm.startBroadcast(deployerPrivateKey);
        try storageContract.getContent("rug-p5.js", "") returns (bytes memory p5Data) {
            console.log("[SUCCESS] rug-p5.js accessible, size:", p5Data.length);
        } catch {
            console.log("[ERROR] rug-p5.js not accessible");
        }

        try storageContract.getContent("rug-algorithm.js", "") returns (bytes memory algoData) {
            console.log("[SUCCESS] rug-algorithm.js accessible, size:", algoData.length);
        } catch {
            console.log("[ERROR] rug-algorithm.js not accessible");
        }
        vm.stopBroadcast();
    }
}
