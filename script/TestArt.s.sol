// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {OnchainRugs} from "../src/OnchainRugs.sol";

contract TestArtScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address onchainRugsAddress = vm.envAddress("ONCHAIN_RUGS_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        OnchainRugs onchainRugs = OnchainRugs(onchainRugsAddress);
        
        // Test data for minting
        string[] memory textRows = new string[](2);
        textRows[0] = "Hello";
        textRows[1] = "World";
        
        uint256 seed = 12345;
        string memory palette = '{"colors":["#FF0000","#00FF00","#0000FF"]}';
        string memory stripeData = '[{"y":0,"height":100,"primaryColor":"#FF0000","secondaryColor":"#00FF00","weaveType":"mixed"}]';
        string memory characterMap = '{"H":[[1,1,1],[1,0,1],[1,1,1]],"e":[[1,1,1],[1,0,0],[1,1,1]],"l":[[1,0,0],[1,0,0],[1,1,1]],"o":[[1,1,1],[1,0,1],[1,1,1]],"W":[[1,0,1],[1,0,1],[1,1,1]],"r":[[1,1,1],[1,0,0],[1,0,0]],"d":[[1,1,1],[1,0,1],[1,1,1]]}';
        uint256 warpThickness = 2;
        
        // Calculate price
        uint256 price = onchainRugs.calculateMintingPrice(textRows);
        console.log("Minting price:", price);
        
        // Mint the rug
        uint256 tokenId = onchainRugs.totalSupply();
        onchainRugs.mintWithText{value: price}(
            textRows,
            seed,
            palette,
            stripeData,
            warpThickness
        );
        
        console.log("Minted rug with tokenId:", tokenId);
        
        // Get the token URI
        string memory tokenURI = onchainRugs.tokenURI(tokenId);
        console.log("Token URI length:", bytes(tokenURI).length);
        console.log("Token URI starts with:", _substring(tokenURI, 0, 50));
        
        vm.stopBroadcast();
    }
    
    function _substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }
}
