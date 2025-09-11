// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

contract TestMintingScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Use deployed contract address (update this after deployment)
        address contractAddress = 0x46270eB2bB5CE81ea29106514679e67d9Fa9ad27; // Updated with new contract
        OnchainRugs onchainRugs = OnchainRugs(contractAddress);
        
        // Test data (from doormat-nft-9667.html)
        string[] memory textRows = new string[](1);
        textRows[0] = "OINON";
        
        string memory palette = '{"name":"Indian Peacock","colors":["#000080","#191970","#4169E1","#4682B4","#00CED1","#40E0D0","#48D1CC","#20B2AA"]}';
        
        string memory stripeData = '[{"y":0,"height":79.21721367165446,"primaryColor":"#48D1CC","secondaryColor":"#48D1CC","weaveType":"solid","warpVariation":0.38434289479628203},{"y":79.21721367165446,"height":85.13879705220461,"primaryColor":"#4682B4","secondaryColor":null,"weaveType":"solid","warpVariation":0.33504934683442117},{"y":164.35601072385907,"height":50.84667540155351,"primaryColor":"#000080","secondaryColor":null,"weaveType":"textured","warpVariation":0.2733596692793071}]';
        
        string memory characterMap = '{"O":["01110","10001","10001","10001","10001","10001","01110"],"I":["11111","00100","00100","00100","00100","00100","11111"],"N":["10001","11001","10101","10011","10001","10001","10001"]," ":["00000","00000","00000","00000","00000","00000","00000"]}';
        
        uint256 warpThickness = 3;
        uint256 seed = 12345;
        
        console.log("Testing minting with real data...");
        console.log("Text rows:", textRows[0]);
        console.log("Palette name: Indian Peacock");
        console.log("Warp thickness:", warpThickness);
        
        // Calculate price
        uint256 price = onchainRugs.calculateMintingPrice(textRows);
        console.log("Minting price:", price);
        
        // Check if text is available
        bool isAvailable = onchainRugs.isTextAvailable(textRows);
        console.log("Text available:", isAvailable);
        
        if (isAvailable) {
            // Mint the NFT
            onchainRugs.mintWithText{value: price}(
                textRows,
                seed,
                palette,
                stripeData,
                characterMap,
                warpThickness,
                false, // showDirt
                0,     // dirtLevel
                false, // showTexture
                0      // textureLevel
            );
            
            console.log("NFT minted successfully!");
            
            // Get token URI
            uint256 tokenId = onchainRugs.totalSupply() - 1;
            string memory tokenURI = onchainRugs.tokenURI(tokenId);
            console.log("Token URI length:", bytes(tokenURI).length);
            console.log("Token URI starts with:", _substring(tokenURI, 0, 50));
        } else {
            console.log("Text already used, cannot mint");
        }
        
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
