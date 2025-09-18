pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadAlgorithmB64 is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading rug-algorithm.js.b64...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use the deployed ScriptyStorageV2
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);
        
        // Upload rug-algorithm.js.b64
        string memory algorithmContent = vm.readFile("data/rug-algorithm.js.b64");
        console.log("Uploading rug-algorithm.js.b64:", bytes(algorithmContent).length, "bytes");
        storageContract.createContent("rug-algorithm.js.b64", bytes(algorithmContent));
        
        console.log("Upload complete!");
    }
}
