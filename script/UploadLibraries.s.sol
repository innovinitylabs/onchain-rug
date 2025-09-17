// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/RugEthFSStorage.sol";

/**
 * @title UploadLibraries
 * @dev Upload p5.js and rug-algorithm.js to RugEthFSStorage
 */
contract UploadLibraries is Script {
    function run() external {
        // Use the first account from Anvil
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Uploading JavaScript libraries to RugEthFSStorage...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // RugEthFSStorage contract address from deployment
        RugEthFSStorage storageContract = RugEthFSStorage(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);

        // Upload p5.js
        console.log("\nUploading p5.js...");
        string memory p5Content = vm.readFile("data/p5.min.js");
        storageContract.storeLibrary("p5.min.js", base64Encode(bytes(p5Content)));
        console.log("p5.js uploaded successfully");

        // Upload rug-algorithm.js
        console.log("\nUploading rug-algorithm.js...");
        string memory algoContent = vm.readFile("data/rug-algorithm.js");
        storageContract.storeLibrary("rug-algorithm.js", base64Encode(bytes(algoContent)));
        console.log("rug-algorithm.js uploaded successfully");

        vm.stopBroadcast();

        // Verify uploads using direct calls
        console.log("\nVerifying uploads...");
        bool p5Exists = storageContract.libraryExists("p5.min.js");
        bool algoExists = storageContract.libraryExists("rug-algorithm.js");

        console.log("p5.min.js uploaded:", p5Exists);
        console.log("rug-algorithm.js uploaded:", algoExists);

        console.log("\nAll libraries uploaded successfully!");
        console.log("You can now mint NFTs with the new on-chain system!");
    }

    // Simple base64 encoding function
    function base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        // Base64 encoding table
        bytes memory base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        bytes memory encoded = new bytes(4 * ((data.length + 2) / 3));

        uint256 i = 0;
        uint256 j = 0;

        for (; i < data.length; i += 3) {
            uint256 n = uint256(uint8(data[i])) << 16;
            if (i + 1 < data.length) n |= uint256(uint8(data[i + 1])) << 8;
            if (i + 2 < data.length) n |= uint256(uint8(data[i + 2]));

            encoded[j++] = base64chars[(n >> 18) & 63];
            encoded[j++] = base64chars[(n >> 12) & 63];
            encoded[j++] = base64chars[(n >> 6) & 63];
            encoded[j++] = base64chars[n & 63];
        }

        uint256 pad = data.length % 3;
        if (pad > 0) {
            encoded[j - 1] = "=";
            if (pad == 1) encoded[j - 2] = "=";
        }

        return string(encoded);
    }
}
