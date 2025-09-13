// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

/**
 * @title AnalyzeTokenURI
 * @dev Analyze the generated tokenURI and check for character map optimization
 */
contract AnalyzeTokenURI is Script {
    function run() external {
        // Contract address from previous deployment
        OnchainRugs rugs = OnchainRugs(0x5FbDB2315678afecb367f032d93F642f64180aa3);

        console.log("Analyzing TokenURI for NFT #1");

        // Get tokenURI
        string memory tokenURI = rugs.tokenURI(1);
        console.log("TokenURI Length:", bytes(tokenURI).length);

        // Check if it contains expected JSON structure
        bool hasJSON = vm.contains(tokenURI, "data:application/json");
        console.log("Contains JSON metadata:", hasJSON ? "YES" : "NO");

        bool hasAnimationURL = vm.contains(tokenURI, "animation_url");
        console.log("Contains animation_url:", hasAnimationURL ? "YES" : "NO");

        bool hasBase64 = vm.contains(tokenURI, "base64");
        console.log("Contains base64:", hasBase64 ? "YES" : "NO");

        // Check for common JSON structure issues
        bool hasName = vm.contains(tokenURI, "name");
        bool hasDescription = vm.contains(tokenURI, "description");
        bool hasImage = vm.contains(tokenURI, "image");
        bool hasAttributes = vm.contains(tokenURI, "attributes");
        console.log("Contains name field:", hasName ? "YES" : "NO");
        console.log("Contains description field:", hasDescription ? "YES" : "NO");
        console.log("Contains image field:", hasImage ? "YES" : "NO");
        console.log("Contains attributes field:", hasAttributes ? "YES" : "NO");

        // Check for potential JSON syntax errors
        bool hasQuotes = vm.contains(tokenURI, '"');
        console.log("Contains quotes (JSON):", hasQuotes ? "YES" : "NO");

        // Look for data:text/html anywhere in the tokenURI
        bool hasHTMLData = vm.contains(tokenURI, "data:text/html");
        console.log("Contains HTML data URL anywhere:", hasHTMLData ? "YES" : "NO");

        // Show first 200 characters to see the structure
        console.log("\nFirst 200 characters of tokenURI:");
        if (bytes(tokenURI).length >= 200) {
            string memory preview = string(abi.encodePacked(
                bytes(tokenURI)[0], bytes(tokenURI)[1], bytes(tokenURI)[2], bytes(tokenURI)[3], bytes(tokenURI)[4],
                bytes(tokenURI)[5], bytes(tokenURI)[6], bytes(tokenURI)[7], bytes(tokenURI)[8], bytes(tokenURI)[9],
                bytes(tokenURI)[10], bytes(tokenURI)[11], bytes(tokenURI)[12], bytes(tokenURI)[13], bytes(tokenURI)[14],
                bytes(tokenURI)[15], bytes(tokenURI)[16], bytes(tokenURI)[17], bytes(tokenURI)[18], bytes(tokenURI)[19],
                bytes(tokenURI)[20], bytes(tokenURI)[21], bytes(tokenURI)[22], bytes(tokenURI)[23], bytes(tokenURI)[24],
                bytes(tokenURI)[25], bytes(tokenURI)[26], bytes(tokenURI)[27], bytes(tokenURI)[28], bytes(tokenURI)[29],
                bytes(tokenURI)[30], bytes(tokenURI)[31], bytes(tokenURI)[32], bytes(tokenURI)[33], bytes(tokenURI)[34],
                bytes(tokenURI)[35], bytes(tokenURI)[36], bytes(tokenURI)[37], bytes(tokenURI)[38], bytes(tokenURI)[39],
                bytes(tokenURI)[40], bytes(tokenURI)[41], bytes(tokenURI)[42], bytes(tokenURI)[43], bytes(tokenURI)[44],
                bytes(tokenURI)[45], bytes(tokenURI)[46], bytes(tokenURI)[47], bytes(tokenURI)[48], bytes(tokenURI)[49],
                bytes(tokenURI)[50], bytes(tokenURI)[51], bytes(tokenURI)[52], bytes(tokenURI)[53], bytes(tokenURI)[54],
                bytes(tokenURI)[55], bytes(tokenURI)[56], bytes(tokenURI)[57], bytes(tokenURI)[58], bytes(tokenURI)[59],
                bytes(tokenURI)[60], bytes(tokenURI)[61], bytes(tokenURI)[62], bytes(tokenURI)[63], bytes(tokenURI)[64],
                bytes(tokenURI)[65], bytes(tokenURI)[66], bytes(tokenURI)[67], bytes(tokenURI)[68], bytes(tokenURI)[69],
                bytes(tokenURI)[70], bytes(tokenURI)[71], bytes(tokenURI)[72], bytes(tokenURI)[73], bytes(tokenURI)[74],
                bytes(tokenURI)[75], bytes(tokenURI)[76], bytes(tokenURI)[77], bytes(tokenURI)[78], bytes(tokenURI)[79],
                bytes(tokenURI)[80], bytes(tokenURI)[81], bytes(tokenURI)[82], bytes(tokenURI)[83], bytes(tokenURI)[84],
                bytes(tokenURI)[85], bytes(tokenURI)[86], bytes(tokenURI)[87], bytes(tokenURI)[88], bytes(tokenURI)[89],
                bytes(tokenURI)[90], bytes(tokenURI)[91], bytes(tokenURI)[92], bytes(tokenURI)[93], bytes(tokenURI)[94],
                bytes(tokenURI)[95], bytes(tokenURI)[96], bytes(tokenURI)[97], bytes(tokenURI)[98], bytes(tokenURI)[99],
                bytes(tokenURI)[100], bytes(tokenURI)[101], bytes(tokenURI)[102], bytes(tokenURI)[103], bytes(tokenURI)[104],
                bytes(tokenURI)[105], bytes(tokenURI)[106], bytes(tokenURI)[107], bytes(tokenURI)[108], bytes(tokenURI)[109],
                bytes(tokenURI)[110], bytes(tokenURI)[111], bytes(tokenURI)[112], bytes(tokenURI)[113], bytes(tokenURI)[114],
                bytes(tokenURI)[115], bytes(tokenURI)[116], bytes(tokenURI)[117], bytes(tokenURI)[118], bytes(tokenURI)[119],
                bytes(tokenURI)[120], bytes(tokenURI)[121], bytes(tokenURI)[122], bytes(tokenURI)[123], bytes(tokenURI)[124],
                bytes(tokenURI)[125], bytes(tokenURI)[126], bytes(tokenURI)[127], bytes(tokenURI)[128], bytes(tokenURI)[129],
                bytes(tokenURI)[130], bytes(tokenURI)[131], bytes(tokenURI)[132], bytes(tokenURI)[133], bytes(tokenURI)[134],
                bytes(tokenURI)[135], bytes(tokenURI)[136], bytes(tokenURI)[137], bytes(tokenURI)[138], bytes(tokenURI)[139],
                bytes(tokenURI)[140], bytes(tokenURI)[141], bytes(tokenURI)[142], bytes(tokenURI)[143], bytes(tokenURI)[144],
                bytes(tokenURI)[145], bytes(tokenURI)[146], bytes(tokenURI)[147], bytes(tokenURI)[148], bytes(tokenURI)[149],
                bytes(tokenURI)[150], bytes(tokenURI)[151], bytes(tokenURI)[152], bytes(tokenURI)[153], bytes(tokenURI)[154],
                bytes(tokenURI)[155], bytes(tokenURI)[156], bytes(tokenURI)[157], bytes(tokenURI)[158], bytes(tokenURI)[159],
                bytes(tokenURI)[160], bytes(tokenURI)[161], bytes(tokenURI)[162], bytes(tokenURI)[163], bytes(tokenURI)[164],
                bytes(tokenURI)[165], bytes(tokenURI)[166], bytes(tokenURI)[167], bytes(tokenURI)[168], bytes(tokenURI)[169],
                bytes(tokenURI)[170], bytes(tokenURI)[171], bytes(tokenURI)[172], bytes(tokenURI)[173], bytes(tokenURI)[174],
                bytes(tokenURI)[175], bytes(tokenURI)[176], bytes(tokenURI)[177], bytes(tokenURI)[178], bytes(tokenURI)[179],
                bytes(tokenURI)[180], bytes(tokenURI)[181], bytes(tokenURI)[182], bytes(tokenURI)[183], bytes(tokenURI)[184],
                bytes(tokenURI)[185], bytes(tokenURI)[186], bytes(tokenURI)[187], bytes(tokenURI)[188], bytes(tokenURI)[189],
                bytes(tokenURI)[190], bytes(tokenURI)[191], bytes(tokenURI)[192], bytes(tokenURI)[193], bytes(tokenURI)[194],
                bytes(tokenURI)[195], bytes(tokenURI)[196], bytes(tokenURI)[197], bytes(tokenURI)[198], bytes(tokenURI)[199]
            ));
            console.log(preview);
        }

        // Check for character map indicators
        bool hasCM = vm.contains(tokenURI, "cm=");
        console.log("Contains character map (cm=):", hasCM ? "YES" : "NO");

        bool hasCharacterMap = vm.contains(tokenURI, "window.characterMap");
        console.log("Contains character map assignment:", hasCharacterMap ? "YES" : "NO");

        // Check for specific characters that should be in optimized map
        bool hasH = vm.contains(tokenURI, '"H"');
        bool hasE = vm.contains(tokenURI, '"E"');
        bool hasL = vm.contains(tokenURI, '"L"');
        console.log("Contains optimized characters (H,E,L):", (hasH && hasE && hasL) ? "YES" : "NO");

        // Check for p5.js and other components
        bool hasP5 = vm.contains(tokenURI, "p5.js");
        console.log("Contains p5.js:", hasP5 ? "YES" : "NO");

        bool hasSetup = vm.contains(tokenURI, "function setup");
        console.log("Contains setup function:", hasSetup ? "YES" : "NO");

        bool hasDraw = vm.contains(tokenURI, "function draw");
        console.log("Contains draw function:", hasDraw ? "YES" : "NO");

        // Try to extract character map section
        string memory cmPattern = "cm=";
        if (vm.contains(tokenURI, cmPattern)) {
            console.log("Character map section found in tokenURI");

            // The tokenURI contains base64 encoded HTML, so we can't easily extract
            // the character map from the raw tokenURI string
            console.log("Note: Character map is base64 encoded in tokenURI");
            console.log("To decode: extract base64 HTML and search for 'cm=' section");
        } else {
            console.log("Character map section NOT found in tokenURI");
        }

        console.log("Analysis complete!");
    }
}
