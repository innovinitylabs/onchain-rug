// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

/**
 * @title UploadToRugScriptyStorage
 * @dev Upload p5.js and rug-algorithm.js to RugScriptyContractStorage with automatic chunking
 */
contract UploadToRugScriptyStorage is Script {
    function run() external {
        // Use the first account from Anvil
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Uploading JavaScript libraries to RugScriptyContractStorage...");
        console.log("Deployer:", deployer);
        console.log("EthFS FileStore: 0xFe1411d6864592549AdE050215482e4385dFa0FB");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ScriptyStorageV2 with mock EthFS for local testing
        console.log("\nDeploying ScriptyStorageV2 for local testing...");
        address mockEthFS = address(0); // Mock address for local testing
        ScriptyStorageV2 storageContract = new ScriptyStorageV2(IFileStore(mockEthFS));
        console.log("ScriptyStorageV2 deployed at:", address(storageContract));

        // Upload p5.js (will be automatically chunked by ScriptyStorageV2)
        console.log("\nUploading rug-p5.js.b64...");
        string memory p5Content = vm.readFile("data/rug-p5.js.b64");
        storageContract.createContent("rug-p5.js.b64", bytes(p5Content));

        // Upload rug-algorithm.js.b64 (will be automatically chunked by ScriptyStorageV2)
        console.log("\nUploading rug-algorithm.js.b64...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js.b64");
        storageContract.createContent("rug-algorithm.js.b64", bytes(algoContent));
        // Freeze the content to prevent further modifications
        storageContract.freezeContent("rug-p5.js.b64");
        storageContract.freezeContent("rug-algorithm.js.b64");
        vm.stopBroadcast();

        console.log("\nAll JavaScript libraries uploaded successfully!");
        console.log("You can now mint NFTs with the new Scripty system!");
        console.log("\nNote: Files are automatically chunked and stored efficiently in ScriptyStorageV2");
    }
}
