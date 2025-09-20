// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title FinalFix
 * @dev Final fix for the incomplete library uploads
 */
contract FinalFix is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address scriptyStorageAddr = vm.envAddress("SCRIPTY_STORAGE_V2");

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== FINAL LIBRARY FIX ===");
        console.log("Deployer:", deployer);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(scriptyStorageAddr);

        // Just add chunks to existing content (since createContent already succeeded)
        console.log("\nAdding chunks to rug-p5.js.b64...");
        string memory p5Content = vm.readFile("data/rug-p5.js.b64");
        storageContract.addChunkToContent("rug-p5.js.b64", bytes(p5Content));
        console.log("p5.js chunks added");

        console.log("\nAdding chunks to rug-algorithm.js.b64...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js.b64");
        storageContract.addChunkToContent("rug-algorithm.js.b64", bytes(algoContent));
        console.log("Algorithm chunks added");

        console.log("\nFreezing libraries...");
        storageContract.freezeContent("rug-p5.js.b64");
        storageContract.freezeContent("rug-algorithm.js.b64");
        console.log("Libraries frozen");

        console.log("\nSubmitting to EthFS...");
        storageContract.submitToEthFSFileStore("rug-p5.js.b64", "");
        storageContract.submitToEthFSFileStore("rug-algorithm.js.b64", "");
        console.log("Submitted to EthFS");

        vm.stopBroadcast();

        console.log("\n=== SUCCESS! ===");
        console.log("Libraries are now properly stored with data chunks!");
        console.log("Your NFTs should now have working p5.js and algorithm libraries.");
    }
}
