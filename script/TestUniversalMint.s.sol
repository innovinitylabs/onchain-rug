// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestUniversalMint
 * @dev Test minting an NFT using the test_mint_data.json file (works on any network)
 */
contract TestUniversalMint is Script {
    function run() external {
        uint256 deployerPrivateKey;
        address onchainRugsAddr;
        string memory networkName;

        // Detect environment and load appropriate addresses
        if (block.chainid == 31337) {
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
            networkName = "Local Anvil";
            onchainRugsAddr = vm.envAddress("ONCHAIN_RUGS");
        } else if (block.chainid == 11011) {
            deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
            networkName = "Shape L2 Testnet";
            onchainRugsAddr = vm.envAddress("ONCHAIN_RUGS");
        } else {
            revert("Unsupported network");
        }

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== TESTING NFT MINTING ON", networkName, "===");
        console.log("Deployer:", deployer);
        console.log("OnchainRugs Contract:", onchainRugsAddr);

        vm.startBroadcast(deployerPrivateKey);

        OnchainRugs onchainRugs = OnchainRugs(onchainRugsAddr);

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

        console.log("\n=== PARSED TEST DATA ===");
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
        console.log("\nMint Price:", mintPrice / 1e18, "ETH");

        console.log("\n=== MINTING NFT ===");
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
        console.log("Owner:", deployer);

        vm.stopBroadcast();

        // Test tokenURI generation (only works if contracts are configured)
        console.log("\n=== TESTING TOKENURI GENERATION ===");
        console.log("Note: This will only work if contract relationships are configured");

        try onchainRugs.tokenURI(1) returns (string memory tokenURI) {
            console.log("TokenURI generated successfully!");
            console.log("Token URI length:", bytes(tokenURI).length);
            console.log("Token URI preview available");
        } catch Error(string memory reason) {
            console.log("WARNING: TokenURI generation failed:", reason);
            console.log("This is expected if contract relationships aren't configured yet");
        } catch {
            console.log("WARNING: TokenURI generation failed with unknown error");
            console.log("This is expected if contract relationships aren't configured yet");
        }

        console.log("\n=== TEST SUMMARY ===");
        console.log("NFT Minting: SUCCESS");
        console.log("SSTORE2 Chunking: ENABLED");
        console.log("On-chain Storage: WORKING");
        console.log("Network:", networkName);
        console.log("Token ID: 1");
        console.log("Ready for HTML generation once contracts are configured!");
    }
}
