pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadBase64Libraries is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading base64 encoded JavaScript libraries...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use the deployed ScriptyStorageV2
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);
        
        // Upload rug-p5.js.b64
        string memory rugP5Content = vm.readFile("data/rug-p5.js.b64");
        console.log("Uploading rug-p5.js.b64:", bytes(rugP5Content).length, "bytes");
        storageContract.createContent("rug-p5.js.b64", bytes(rugP5Content));
        
        // Upload rug-algorithm-with-config.js.b64
        string memory rugAlgorithmContent = vm.readFile("data/rug-algorithm-with-config.js.b64");
        console.log("Uploading rug-algorithm-with-config.js.b64:", bytes(rugAlgorithmContent).length, "bytes");
        storageContract.createContent("rug-algorithm-with-config.js.b64", bytes(rugAlgorithmContent));
        
        console.log("Upload complete!");
    }
}
