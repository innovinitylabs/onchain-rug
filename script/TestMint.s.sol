// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestMint
 * @dev Test minting an NFT with the new Rug Scripty system
 */
contract TestMint is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Testing NFT minting with Rug Scripty system...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        OnchainRugs onchainRugs = OnchainRugs(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);

        // Mint an NFT
        string[] memory textRows = new string[](2);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";

        uint256 seed = 12345;
        string memory paletteName = "default";
        string memory minifiedStripeData = "0,1,2,3,4";
        string memory minifiedPalette = "255,0,0,0,255,0,0,0,255";
        string memory filteredCharacterMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        uint8 warpThickness = 8;
        uint8 complexity = 5;
        uint256 characterCount = 10;
        uint256 stripeCount = 5;

        console.log("Minting NFT...");
        onchainRugs.mintRug{value: onchainRugs.getMintPrice(textRows.length)}(
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

        console.log("NFT minted successfully!");
        console.log("Token ID: 0");

        vm.stopBroadcast();

        // Test tokenURI
        console.log("Testing tokenURI...");
        string memory tokenURI = onchainRugs.tokenURI(0);
        console.log("Token URI length:", bytes(tokenURI).length);

        console.log("Test completed successfully!");
    }
}
