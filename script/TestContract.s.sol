// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestContract
 * @dev Test the OnchainRugsV2Shape contract functionality
 */
contract TestContract is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract
        OnchainRugs rugs = new OnchainRugs();
        console.log("Contract deployed at:", address(rugs));

        // Test basic functionality
        console.log("Name:", rugs.name());
        console.log("Symbol:", rugs.symbol());
        console.log("Max Supply:", rugs.maxSupply());
        console.log("Total Supply:", rugs.totalSupply());

        // Test minting price calculation
        uint256 price1 = rugs.getMintPrice(1);
        uint256 price2 = rugs.getMintPrice(2);
        uint256 price3 = rugs.getMintPrice(3);
        console.log("Price for 1 line:", price1 / 1e18, "ETH");
        console.log("Price for 2 lines:", price2 / 1e18, "ETH");
        console.log("Price for 3 lines:", price3 / 1e18, "ETH");

        // Test minting with basic data
        string[] memory textRows = new string[](1);
        textRows[0] = "HELLO";

        string memory palette = '{"name":"Test","colors":["#FF0000","#00FF00","#0000FF"]}';
        string memory stripeData = '[{"y":0,"height":100,"primaryColor":"#FF0000","secondaryColor":null,"weaveType":"solid","warpVariation":0.2}]';
        string memory characterMap = '{"H":[[1,1,1],[1,0,1],[1,1,1]],"E":[[1,1,1],[1,1,1],[1,1,1]],"L":[[1,0,0],[1,0,0],[1,1,1]],"O":[[0,1,0],[1,0,1],[0,1,0]]," ":[[]]}';

        uint256 mintPrice = rugs.getMintPrice(1);
        console.log("Minting price:", mintPrice / 1e18, "ETH");

        rugs.mintRug{value: mintPrice}(
            textRows,
            0, // auto-generate seed
            "Test Palette", // palette name
            stripeData,
            palette, // minified palette
            characterMap,
            2, // warp thickness
            1, // complexity
            5, // character count
            1  // stripe count
        );

        console.log("Successfully minted NFT #1");

        // Test tokenURI
        string memory uri = rugs.tokenURI(1);
        console.log("TokenURI generated successfully");
        console.log("URI length:", bytes(uri).length, "characters");

        // Test aging system
        uint8 dirtLevel = rugs.calculateAgingState(1);
        console.log("Initial dirt level:", dirtLevel);

        vm.stopBroadcast();

        console.log("All tests passed!");
        console.log("Contract is ready for deployment!");
    }
}
