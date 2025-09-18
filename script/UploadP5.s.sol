// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/ethfs/IFileStore.sol";

contract UploadP5 is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading p5.min.js to EthFS FileStore...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        IFileStore fileStore = IFileStore(0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82);
        
        // Read p5.min.js content
        string memory p5Content = vm.readFile("data/p5.min.js");
        console.log("File size:", bytes(p5Content).length, "bytes");
        
        // Upload to EthFS
        console.log("Uploading...");
        fileStore.createFile("p5.min.js", p5Content);
        
        vm.stopBroadcast();
        
        console.log("p5.min.js uploaded successfully!");
    }
}
