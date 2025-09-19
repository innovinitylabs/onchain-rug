pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadToNewStorage is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading libraries to new ScriptyStorageV2...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB);
        
        // Upload rug-p5.js.gz.b64
        string memory rugP5Content = vm.readFile("data/rug-p5.js.gz.b64");
        console.log("Uploading rug-p5.js.gz.b64:", bytes(rugP5Content).length, "bytes");
        storageContract.createContent("rug-p5.js.gz.b64", bytes(rugP5Content));
        
        // Upload rug-algorithm.js.gz.b64
        string memory rugAlgorithmContent = vm.readFile("data/rug-algorithm.js.gz.b64");
        console.log("Uploading rug-algorithm.js.gz.b64:", bytes(rugAlgorithmContent).length, "bytes");
        storageContract.createContent("rug-algorithm.js.gz.b64", bytes(rugAlgorithmContent));
        
        vm.stopBroadcast();
        
        console.log("Upload complete!");
    }
}
