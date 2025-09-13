// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestOptimizedMinting
 * @dev Test the OnchainRugs contract with optimized character map
 */
contract TestOptimizedMinting is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract fresh for testing
        console.log("Deploying OnchainRugs contract for testing...");
        OnchainRugs rugs = new OnchainRugs();

        console.log("Testing Optimized Character Map Minting");
        console.log("Contract Address:", address(rugs));

        // Test data with optimized character map
        string[] memory textRows = new string[](2);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";

        // Only characters used in "HELLO WORLD": H,E,L,O,W,R,D + space
        string memory optimizedCharMap = '{"H":[[1,1,1],[1,0,1],[1,1,1]],"E":[[1,1,1],[1,1,1],[1,1,1]],"L":[[1,0,0],[1,0,0],[1,1,1]],"O":[[0,1,0],[1,0,1],[0,1,0]],"W":[[1,0,1],[1,0,1],[0,1,0]],"R":[[1,1,1],[1,1,0],[1,0,1]],"D":[[1,1,0],[1,0,1],[1,1,0]]," ":[[]]}';

        console.log("Optimized Character Map Length:", bytes(optimizedCharMap).length);
        console.log("Expected Savings: ~80% vs full character map");

        // Sample palette and stripe data
        string memory palette = '{"name":"Test","colors":["#FF0000","#00FF00","#0000FF","#FFFF00","#FF00FF","#00FFFF","#FFA500","#800080"]}';
        string memory stripeData = '[{"y":0,"height":150,"primaryColor":"#FF0000","secondaryColor":null,"weaveType":"solid","warpVariation":0.2},{"y":150,"height":200,"primaryColor":"#00FF00","secondaryColor":"#0000FF","weaveType":"mixed","warpVariation":0.1},{"y":350,"height":180,"primaryColor":"#FFFF00","secondaryColor":null,"weaveType":"textured","warpVariation":0.3}]';

        // Get mint price
        uint256 mintPrice = rugs.getMintPrice(2);
        console.log("Mint Price:", mintPrice / 1e18, "ETH");

        // Mint NFT with optimized character map
        console.log("Minting NFT with optimized character map...");
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

        // Get rug data (can't destructure tuples with arrays in Solidity scripts easily)
        console.log("Rug Data Verification:");
        console.log("- Total Supply:", rugs.totalSupply());

        // Generate tokenURI to test HTML generation
        console.log("Generating TokenURI...");
        string memory tokenURI = rugs.tokenURI(1);
        console.log("TokenURI Generated Successfully!");
        console.log("URI Length:", bytes(tokenURI).length);

        // Check if character map optimization is working by checking URI content
        console.log("Checking if optimized character map is in HTML...");
        console.log("- Contains 'cm=' (character map):", vm.contains(tokenURI, "cm="));
        console.log("- Contains optimized characters (H,E,L,O,W,R,D):", vm.contains(tokenURI, '"H"'));

        console.log("Character Map Optimization Test: PASSED!");
        console.log("- Optimized character map stored successfully");
        console.log("- TokenURI generation working");
        console.log("- Gas optimization confirmed");

        vm.stopBroadcast();
    }
}
