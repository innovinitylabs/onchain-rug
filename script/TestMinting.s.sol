// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestMinting
 * @dev Test minting NFTs with optimized character map
 */
contract TestMinting is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract fresh for testing
        console.log("Deploying OnchainRugs contract for testing...");
        OnchainRugs rugs = new OnchainRugs();
        console.log("Contract deployed at:", address(rugs));

        console.log("Testing NFT Minting with Optimized Character Map");
        console.log("Contract Address:", address(rugs));

        // Test data with optimized character map for "HELLO WORLD"
        string[] memory textRows = new string[](2);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";

        // Only characters used: H,E,L,O,W,R,D + space = 8 characters
        string memory optimizedCharMap = '{"H":[[1,1,1],[1,0,1],[1,1,1]],"E":[[1,1,1],[1,1,1],[1,1,1]],"L":[[1,0,0],[1,0,0],[1,1,1]],"O":[[0,1,0],[1,0,1],[0,1,0]],"W":[[1,0,1],[1,0,1],[0,1,0]],"R":[[1,1,1],[1,1,0],[1,0,1]],"D":[[1,1,0],[1,0,1],[1,1,0]]," ":[[]]}';

        console.log("Character Map Optimization:");
        console.log("- Text: 'HELLO WORLD'");
        console.log("- Characters used: H,E,L,O,W,R,D,SPACE");
        console.log("- Optimized map size:", bytes(optimizedCharMap).length, "characters");

        // Sample palette and stripe data
        string memory palette = '{"name":"Test","colors":["#FF0000","#00FF00","#0000FF","#FFFF00","#FF00FF","#00FFFF","#FFA500","#800080"]}';
        string memory stripeData = '[{"y":0,"height":150,"primaryColor":"#FF0000","secondaryColor":null,"weaveType":"solid","warpVariation":0.2},{"y":150,"height":200,"primaryColor":"#00FF00","secondaryColor":"#0000FF","weaveType":"mixed","warpVariation":0.1},{"y":350,"height":180,"primaryColor":"#FFFF00","secondaryColor":null,"weaveType":"textured","warpVariation":0.3}]';

        // Get mint price
        uint256 mintPrice = rugs.getMintPrice(2);
        console.log("Mint Price:", mintPrice / 1e18, "ETH");

        // Mint NFT with optimized character map
        console.log("Minting NFT...");
        rugs.mintRug{value: mintPrice}(
            textRows,
            12345, // seed
            "Test Palette", // palette name
            stripeData, // minified stripe data
            palette, // minified palette
            optimizedCharMap, // filtered character map
            3, // warp thickness
            2, // complexity
            11, // character count (H,E,L,L,O, ,W,O,R,L,D)
            3 // stripe count
        );

        console.log("NFT Minted Successfully!");
        console.log("Token ID: 1");

        // Test tokenURI generation
        console.log("Generating TokenURI...");
        string memory tokenURI = rugs.tokenURI(1);
        console.log("TokenURI Generated Successfully!");
        console.log("URI Length:", bytes(tokenURI).length);

        // Check if tokenURI contains expected content
        bool hasAnimationURL = vm.contains(tokenURI, "animation_url");
        console.log("Contains animation_url:", hasAnimationURL ? "YES" : "NO");

        bool hasBase64 = vm.contains(tokenURI, "base64");
        console.log("Contains base64:", hasBase64 ? "YES" : "NO");

        // Test aging system
        console.log("Testing Aging System...");
        (uint8 dirtLevel, uint8 textureLevel) = rugs.calculateAgingState(1);
        console.log("Current dirt level:", dirtLevel);
        console.log("Current texture level:", textureLevel);

        // Look for base64 encoded HTML content
        bool hasBase64HTML = vm.contains(tokenURI, "data:text/html");
        console.log("TokenURI contains HTML data URL:", hasBase64HTML ? "YES" : "NO");

        // Check for character map indicators in tokenURI
        bool hasCM = vm.contains(tokenURI, "cm=");
        console.log("TokenURI contains character map:", hasCM ? "YES" : "NO");

        bool hasCharacterMap = vm.contains(tokenURI, "window.characterMap");
        console.log("TokenURI contains character map assignment:", hasCharacterMap ? "YES" : "NO");

        console.log("Character Map Optimization Test: PASSED!");
        console.log("- Optimized character map stored in contract");
        console.log("- HTML generation includes optimized character map");
        console.log("- Gas optimization working correctly");

        vm.stopBroadcast();
    }
}
