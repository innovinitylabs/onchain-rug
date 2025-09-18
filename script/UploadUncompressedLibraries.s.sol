pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadUncompressedLibraries is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading uncompressed JavaScript libraries...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use the latest ScriptyStorageV2 address
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0x851356ae760d987E095750cCeb3bC6014560891C);
        
        // Upload rug-p5.js
        string memory rugP5Content = vm.readFile("data/rug-p5.js");
        console.log("Uploading rug-p5.js:", bytes(rugP5Content).length, "bytes");
        storageContract.createContent("rug-p5.js", bytes(rugP5Content));
        
        // Upload rug-algorithm.js
        string memory rugAlgorithmContent = vm.readFile("data/rug-algorithm.js");
        console.log("Uploading rug-algorithm.js:", bytes(rugAlgorithmContent).length, "bytes");
        storageContract.createContent("rug-algorithm.js", bytes(rugAlgorithmContent));
        
        console.log("Upload complete!");
    }
}
