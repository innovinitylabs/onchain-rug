// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestMintWithData
 * @dev Test minting an NFT using the test_mint_data.json file
 */
contract TestMintWithData is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Testing NFT minting with test_mint_data.json...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Use the deployed OnchainRugs contract
        OnchainRugs onchainRugs = OnchainRugs(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);

        // Read test data from JSON file
        string memory jsonData = vm.readFile("data/test_mint_data.json");

        // Parse JSON data
        uint256 seed = abi.decode(vm.parseJson(jsonData, ".seed"), (uint256));
        string[] memory textRows = vm.parseJsonStringArray(jsonData, ".textRows");
        string memory paletteName = vm.parseJsonString(jsonData, ".palette.name");
        string memory minifiedStripeData = vm.parseJsonString(jsonData, ".minifiedStripeData");
        string memory minifiedPalette = vm.parseJsonString(jsonData, ".minifiedPalette");
        string memory filteredCharacterMap = vm.parseJsonString(jsonData, ".filteredCharacterMap");
        uint8 warpThickness = uint8(abi.decode(vm.parseJson(jsonData, ".warpThickness"), (uint256)));
        uint8 complexity = uint8(abi.decode(vm.parseJson(jsonData, ".complexity"), (uint256)));
        uint256 characterCount = abi.decode(vm.parseJson(jsonData, ".characterCount"), (uint256));
        uint256 stripeCount = abi.decode(vm.parseJson(jsonData, ".stripeCount"), (uint256));

        console.log("Parsed test data:");
        console.log("- Seed:", seed);
        console.log("- Text Rows:");
        for (uint256 i = 0; i < textRows.length; i++) {
            console.log("  ", i, ":", textRows[i]);
        }
        console.log("- Palette:", paletteName);
        console.log("- Warp Thickness:", warpThickness);
        console.log("- Complexity:", complexity);
        console.log("- Character Count:", characterCount);
        console.log("- Stripe Count:", stripeCount);

        // Calculate mint price
        uint256 mintPrice = onchainRugs.getMintPrice(textRows.length);
        console.log("Mint Price:", mintPrice / 1e18, "ETH");

        console.log("\nMinting NFT with test data...");
        onchainRugs.mintRug{value: mintPrice}(
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
        console.log("Token ID: 1");

        vm.stopBroadcast();

        // Test tokenURI generation
        console.log("\nTesting tokenURI generation...");
        string memory tokenURI = onchainRugs.tokenURI(1);
        console.log("Token URI length:", bytes(tokenURI).length);

        // Extract and display the HTML content for verification
        console.log("Token URI preview (first 200 chars):");
        console.log(tokenURI);

        console.log("\nTest completed successfully!");
        console.log("Your on-chain rug NFT has been minted!");
    }
}
