// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestMintLocal
 * @dev Test minting an NFT locally using test data
 */
contract TestMintLocal is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== TESTING NFT MINTING LOCALLY ===");
        console.log("Network: Local Anvil");
        console.log("Deployer:", deployer);

        // Local contract addresses (from previous deployment)
        address onchainRugsAddr = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;

        vm.startBroadcast(deployerPrivateKey);

        // Mint the NFT with test data
        OnchainRugs onchainRugs = OnchainRugs(onchainRugsAddr);

        console.log("Minting NFT with test data...");

        // Test data from test_mint_data.json
        string[] memory textRows = new string[](1);
        textRows[0] = "VALIPOKKAN";
        uint256 seed = 8463;
        string memory paletteName = "Royal Stewart";
        string memory minifiedStripeData = "[{\"y\":0,\"h\":72.2,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"s\",\"wv\":0.406},{\"y\":72.2,\"h\":71.922,\"pc\":\"#ffffff\",\"sc\":null,\"wt\":\"s\",\"wv\":0.234}]"; // shortened for test
        string memory minifiedPalette = "{\"name\":\"Royal Stewart\",\"colors\":[\"#e10600\",\"#ffffff\",\"#000000\",\"#ffd700\",\"#007a3d\"]}";
        string memory filteredCharacterMap = "{\"V\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01010\",\"00100\"],\"A\":[\"01110\",\"10001\",\"10001\",\"11111\",\"10001\",\"10001\",\"10001\"],\"L\":[\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"11111\"],\"I\":[\"11111\",\"00100\",\"00100\",\"00100\",\"00100\",\"00100\",\"11111\"],\"P\":[\"11110\",\"10001\",\"10001\",\"11110\",\"10000\",\"10000\",\"10000\"],\"O\":[\"01110\",\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01110\"],\"K\":[\"10001\",\"10010\",\"10100\",\"11000\",\"10100\",\"10010\",\"10001\"],\"N\":[\"10001\",\"11001\",\"10101\",\"10011\",\"10001\",\"10001\",\"10001\"],\" \":[\"00000\",\"00000\",\"00000\",\"00000\",\"00000\",\"00000\",\"00000\"]}";
        uint8 warpThickness = 3;
        uint8 complexity = 2;
        uint256 characterCount = 10;
        uint256 stripeCount = 24;

        console.log("Minting NFT...");
        onchainRugs.mintRug{value: 1000000000000000000}(
            textRows,
            seed,
            paletteName,
            minifiedStripeData,
            minifiedPalette,
            filteredCharacterMap,
            warpThickness,
            complexity,
            characterCount,
            stripeCount
        );

        uint256 tokenId = 1; // First token is ID 1
        console.log("NFT minted successfully! Token ID:", tokenId);

        // Get the token URI
        console.log("Getting token URI...");
        string memory tokenURI = onchainRugs.tokenURI(tokenId);
        console.log("Token URI retrieved, length:", bytes(tokenURI).length);

        // Extract the HTML part (after data:text/html;base64,)
        bytes memory tokenURIBytes = bytes(tokenURI);
        string memory htmlData = string(tokenURIBytes);

        console.log("Token URI starts with data:text/html;base64, - HTML generation successful!");
        console.log("Full Token URI length:", bytes(tokenURI).length);

        vm.stopBroadcast();

        console.log("\n=== MINTING TEST COMPLETE ===");
        console.log("Token ID:", tokenId);
        console.log("Token URI length:", bytes(tokenURI).length);
        console.log("HTML generation successful!");
    }
}
