// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadP5 is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading rug-p5.js to ScriptyStorageV2...");

        vm.startBroadcast(deployerPrivateKey);

        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);

        // Read rug-p5.js content
        string memory p5Content = vm.readFile("data/rug-p5.js");
        console.log("File size:", bytes(p5Content).length, "bytes");

        // Upload to ScriptyStorageV2
        console.log("Uploading...");
        storageContract.createContent("rug-p5.js", bytes(p5Content));

        vm.stopBroadcast();

        console.log("rug-p5.js uploaded successfully!");
    }
}
