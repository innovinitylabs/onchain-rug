pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract UploadRugAlgorithm is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Uploading rug-algorithm.js.gz to ScriptyStorageV2...");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ScriptyStorageV2 storageContract = ScriptyStorageV2(0xc6e7DF5E7b4f2A278906862b61205850344D4e7d);
        
        string memory rugAlgorithmGzContent = vm.readFile("data/rug-algorithm.js.gz.b64");
        console.log("File size:", bytes(rugAlgorithmGzContent).length, "bytes");
        
        storageContract.createContent("rug-algorithm.js.gz", bytes(rugAlgorithmGzContent));
        
        vm.stopBroadcast();
        
        console.log("Upload complete!");
    }
}
