pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadBase64CorrectNames is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading base64 encoded JavaScript libraries with correct names...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use the newly deployed ScriptyStorageV2
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512);
        
        // Upload base64 encoded rug-p5.js as rug-p5.b64
        string memory rugP5B64Content = vm.readFile("data/rug-p5.js.b64");
        console.log("Uploading rug-p5.b64:", bytes(rugP5B64Content).length, "bytes");
        storageContract.createContent("rug-p5.b64", bytes(rugP5B64Content));
        
        // Upload base64 encoded rug-algorithm-with-config.js as rug-algorithm-with-config.b64
        string memory rugAlgorithmB64Content = vm.readFile("data/rug-algorithm-with-config.js.b64");
        console.log("Uploading rug-algorithm-with-config.b64:", bytes(rugAlgorithmB64Content).length, "bytes");
        storageContract.createContent("rug-algorithm-with-config.b64", bytes(rugAlgorithmB64Content));
        
        console.log("Upload complete!");
    }
}
