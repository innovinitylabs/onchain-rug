// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "../scripty-reference/contracts/scripty/ScriptyStorageV2.sol";

contract DeployOriginalScriptyTestnet is Script {
    function run() external {
        vm.startBroadcast();

        console.log("=== DEPLOYING ORIGINAL SCRIPTY STORAGE V2 TO SHAPE TESTNET ===");

        // EthFS FileStore address (same on all networks)
        address ethfsFileStoreAddr = 0xFe1411d6864592549AdE050215482e4385dFa0FB;

        console.log("EthFS FileStore address:", ethfsFileStoreAddr);

        // Deploy the original ScriptyStorageV2 contract
        console.log("Deploying ScriptyStorageV2...");
        ScriptyStorageV2 scriptyStorage = new ScriptyStorageV2(IFileStore(ethfsFileStoreAddr));
        console.log("ScriptyStorageV2 deployed at:", address(scriptyStorage));

        // Verify deployment
        console.log("Verifying deployment...");
        console.log("Owner:", scriptyStorage.owner());
        console.log("EthFS FileStore:", address(scriptyStorage.ethfsFileStore()));

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("ORIGINAL SCRIPTY STORAGE V2 DEPLOYMENT");
        console.log("===========================================");
        console.log("Contract Address:", address(scriptyStorage));
        console.log("Network: Shape L2 Testnet");
        console.log("EthFS FileStore:", ethfsFileStoreAddr);
    }
}
