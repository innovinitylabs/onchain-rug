// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/scripty/ScriptyBuilderV2.sol";

/**
 * @title Test TokenURI Generation
 * @notice Test script to verify tokenURI generation works with fixed file names
 */
contract TestTokenURI is Script {

    function run() external view {
        console.log("=== Testing TokenURI Generation ===");

        // Use deployed contract addresses directly
        OnchainRugs onchainRugs = OnchainRugs(payable(0x73db032918FAEb5c853045cF8e9F70362738a8ee));
        ScriptyStorageV2 scriptyStorage = ScriptyStorageV2(payable(0x8523D1ED6e4a2AC12d25A22F829Ffa50c205D58e));
        ScriptyBuilderV2 scriptyBuilder = ScriptyBuilderV2(payable(0x8548f9f9837E055dCa729DC2f6067CC9aC6A0EA8));
        OnchainRugsHTMLGenerator htmlGenerator = OnchainRugsHTMLGenerator(payable(0x0aB9850E205807c615bA936eA27D020406D78131));

        console.log("OnchainRugs contract:", address(onchainRugs));
        console.log("ScriptyStorage contract:", address(scriptyStorage));
        console.log("ScriptyBuilder contract:", address(scriptyBuilder));
        console.log("HTMLGenerator contract:", address(htmlGenerator));

        // Check if contracts are properly configured
        console.log("\n=== Contract Configuration Check ===");
        console.log("Rug Scripty Builder:", onchainRugs.rugScriptyBuilder());
        console.log("Rug EthFS Storage:", onchainRugs.rugEthFSStorage());
        console.log("OnchainRugs HTML Generator:", onchainRugs.onchainRugsHTMLGenerator());

        // Check required libraries
        string[] memory libraries = htmlGenerator.getRequiredLibraries();
        console.log("\n=== Required Libraries ===");
        for (uint256 i = 0; i < libraries.length; i++) {
            console.log(string.concat("Library ", Strings.toString(i + 1), ": ", libraries[i]));
        }

        // Test library retrieval
        console.log("\n=== Testing Library Retrieval ===");
        testLibraryRetrieval(scriptyStorage, "rug-p5.js.b64");
        testLibraryRetrieval(scriptyStorage, "rug-algo.js.b64");

        // Test tokenURI generation (if there are any tokens)
        console.log("\n=== Testing TokenURI Generation ===");
        uint256 totalSupply = onchainRugs.totalSupply();
        console.log("Total Supply:", totalSupply);

        if (totalSupply > 0) {
            console.log("Testing tokenURI for tokenId 1...");
            string memory tokenURI = onchainRugs.tokenURI(1);
            console.log("SUCCESS: TokenURI generated successfully!");
            console.log("Length:", bytes(tokenURI).length, "characters");

            // Extract animation_url from tokenURI
            string memory animationUrl = extractAnimationUrl(tokenURI);
            console.log("Animation URL extracted:", bytes(animationUrl).length > 0 ? "YES" : "NO");

            if (bytes(animationUrl).length > 0) {
                console.log("Animation URL preview:", _slice(animationUrl, 0, 100));
            }
        } else {
            console.log("No tokens minted yet - skipping tokenURI test");
        }
    }

    function testLibraryRetrieval(ScriptyStorageV2 storage_, string memory fileName) internal view {
        console.log(string.concat("Testing retrieval of: ", fileName));
        try storage_.getContent(fileName, "") returns (bytes memory content) {
            console.log("SUCCESS: Retrieved successfully, size:", content.length, "bytes");

            if (content.length > 0) {
                // Show first 100 bytes as string
                uint256 previewLength = content.length > 100 ? 100 : content.length;
                bytes memory preview = new bytes(previewLength);
                for (uint256 i = 0; i < previewLength; i++) {
                    preview[i] = content[i];
                }
                console.log("Preview:", string(preview));
            }
        } catch {
            console.log("ERROR: Failed to retrieve library");
        }
    }

    function extractAnimationUrl(string memory tokenURI) internal pure returns (string memory) {
        // Parse the JSON to extract animation_url
        // This is a simplified extraction - in practice you'd use a JSON parser
        bytes memory uriBytes = bytes(tokenURI);

        // Look for "animation_url" in the JSON
        string memory searchPattern = '"animation_url":"';
        bytes memory patternBytes = bytes(searchPattern);

        for (uint256 i = 0; i <= uriBytes.length - patternBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < patternBytes.length; j++) {
                if (uriBytes[i + j] != patternBytes[j]) {
                    found = false;
                    break;
                }
            }

            if (found) {
                // Found the pattern, now extract until the closing quote
                uint256 start = i + patternBytes.length;
                uint256 end = start;

                while (end < uriBytes.length && uriBytes[end] != '"') {
                    end++;
                }

                if (end < uriBytes.length) {
                    bytes memory result = new bytes(end - start);
                    for (uint256 k = start; k < end; k++) {
                        result[k - start] = uriBytes[k];
                    }
                    return string(result);
                }
            }
        }

        return "";
    }

    function _slice(string memory str, uint256 start, uint256 length) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length && start + i < strBytes.length; i++) {
            result[i] = strBytes[start + i];
        }
        return string(result);
    }
}
