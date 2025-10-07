// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {HTMLRequest, HTMLTag, HTMLTagType} from "./scripty/core/ScriptyStructs.sol";
import {IScriptyBuilderV2} from "./scripty/interfaces/IScriptyBuilderV2.sol";
import {IProjectHTMLGenerator} from "./IProjectHTMLGenerator.sol";

/////////////////////////////////////////////////////////////////////////////////////////////////
/// ██╗   ██╗ █████╗ ██╗     ██╗██████╗  ██████╗ ██╗  ██╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗ ///
/// ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔═══██╗██║ ██╔╝██║ ██╔╝██╔══██╗████╗  ██║████╗  ██║ ///
/// ██║   ██║███████║██║     ██║██████╔╝██║   ██║█████╔╝ █████╔╝ ███████║██╔██╗ ██║██╔██╗ ██║ ///
/// ╚██╗ ██╔╝██╔══██║██║     ██║██╔═══╝ ██║   ██║██╔═██╗ ██╔═██╗ ██╔══██║██║╚██╗██║██║╚██╗██║ ///
///  ╚████╔╝ ██║  ██║███████╗██║██║     ╚██████╔╝██║  ██╗██║  ██╗██║  ██║██║ ╚████║██║ ╚████║ ///
///   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ///
/////////////////////////////////////////////////////////////////////////////////////////////////

//░░░░░░░░░░░░░░░░░░░░░░░    ONCHAIN RUGS HTML    ░░░░░░░░░░░░░░░░░░░░░░//

/**
 * @title OnchainRugsHTMLGenerator
 * @notice Project-specific HTML generator for OnchainRugs using scripty.sol
 * @dev Implements IProjectHTMLGenerator for OnchainRugs project
 * @author @valipokkann
 */
contract OnchainRugsHTMLGenerator is IProjectHTMLGenerator {
    using Strings for uint256;
    using Strings for uint8;

    // Rug data structure (specific to OnchainRugs project)
    // MUST match LibRugStorage.RugData exactly for abi.decode to work
    struct RugData {
        uint256 seed;                    // Generation seed
        string[] textRows;              // User text (1-5 lines)
        string paletteName;             // Color palette identifier
        string minifiedPalette;         // Compressed color data
        string minifiedStripeData;      // Compressed pattern data
        uint8 warpThickness;            // Design parameter (1-5)
        uint256 mintTime;               // Auto-set on mint
        string filteredCharacterMap;    // Used characters only
        uint8 complexity;               // Pattern complexity (1-5)
        uint256 characterCount;         // Total characters
        uint256 stripeCount;            // Pattern stripes
    }

    /**
     * @notice Generate HTML for OnchainRugs token
     * @param projectData Encoded RugData
     * @param tokenId The token ID
     * @param dirtLevel Current dirt level (0-2)
     * @param textureLevel Current texture level (0-10)
     * @param frameLevel Frame level string ("None", "Bronze", "Silver", "Gold", "Platinum", "Diamond")
     * @param scriptyBuilder Address of ScriptyBuilderV2
     * @param scriptyStorage Address of ScriptyStorage
     * @return html Generated HTML string
     */
    function generateProjectHTML(
        bytes memory projectData,
        uint256 tokenId,
        uint8 dirtLevel,
        uint8 textureLevel,
        string memory frameLevel,
        address scriptyBuilder,
        address scriptyStorage
    ) external view override returns (string memory html) {
        RugData memory rug = abi.decode(projectData, (RugData));

        // Create HTML request using existing method
        HTMLRequest memory htmlRequest = createHTMLRequest(scriptyStorage, rug, dirtLevel, textureLevel, frameLevel, tokenId);

        // Use Scripty to generate HTML (raw HTML, not URL-safe)
        bytes memory rawHTML = IScriptyBuilderV2(scriptyBuilder).getHTML(htmlRequest);

        // Convert to base64 and add data URI prefix
        string memory base64HTML = Base64.encode(rawHTML);
        return string.concat("data:text/html;base64,", base64HTML);
    }

    /**
     * @notice Get required JavaScript libraries for OnchainRugs
     * @return libraries Array of required library names
     */
    function getRequiredLibraries() external pure override returns (string[] memory libraries) {
        libraries = new string[](3);
        libraries[0] = "rug-p5.js";
        libraries[1] = "rug-algo.js";
        libraries[2] = "rug-frame.js";
    }

    /**
     * @notice Get project name
     * @return name Project name
     */
    function getProjectName() external pure override returns (string memory name) {
        return "OnchainRugs";
    }

    /**
     * @notice Get project description
     * @return description Project description
     */
    function getProjectDescription() external pure override returns (string memory description) {
        return "Fully on-chain NFT rug collection with complete p5.js algorithm";
    }

    /**
     * @notice Generate rug-specific configuration JavaScript
     * @param rug Rug data
     * @return js JavaScript configuration string
     */
    function generateRugConfig(RugData memory rug, uint8 dirtLevel, uint8 textureLevel, string memory frameLevel) internal pure returns (string memory js) {
        string memory frameCode = mapFrameLevelToCode(frameLevel);
        return string.concat(
            'let w=800,h=1200,f=30,wt=8,wp=',
            rug.warpThickness.toString(),
            ',ts=2,lt,dt,p=\'',
            rug.minifiedPalette,
            '\',sd=\'',
            rug.minifiedStripeData,
            '\',tr=',
            encodeTextRows(rug.textRows),
            ',td=[],s=',
            rug.seed.toString(),
            ',cm=\'',
            rug.filteredCharacterMap,
            '\',tl=',
            Strings.toString(textureLevel),
            ',dl=',
            Strings.toString(dirtLevel),
            ',fl="',
            frameCode,
            '";p=JSON.parse(p);sd=JSON.parse(sd);cm=JSON.parse(cm);'
        );
    }

    /**
     * @notice Map frame level string to single-letter code for JavaScript
     * @param frameLevel Full frame level name
     * @return code Single-letter code (G, B, S, D)
     */
    function mapFrameLevelToCode(string memory frameLevel) internal pure returns (string memory code) {
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Gold"))) return "G";
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Bronze"))) return "B";
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Silver"))) return "S";
        if (keccak256(abi.encodePacked(frameLevel)) == keccak256(abi.encodePacked("Diamond"))) return "D";
        return "G"; // Default fallback to Gold
    }

    /**
     * @notice Encode text rows to JavaScript array format
     * @param textRows Array of text rows
     * @return encoded Encoded JavaScript array string
     */
    function encodeTextRows(string[] memory textRows) internal pure returns (string memory encoded) {
        if (textRows.length == 0) return "[]";

        encoded = "[";
        for (uint256 i = 0; i < textRows.length; i++) {
            if (i > 0) encoded = string.concat(encoded, ",");
            encoded = string.concat(encoded, '"', textRows[i], '"');
        }
        return string.concat(encoded, "]");
    }

    /**
     * @notice Create HTML request for RugScriptyHTML with proper tag structure
     * @param scriptyStorage Address of ScriptyStorage
     * @param rug Rug data
     * @param dirtLevel Current dirt level (0-2)
     * @param textureLevel Current texture level (0-10)
     * @param tokenId The token ID
     * @return htmlRequest Properly structured HTML request for scripty
     */
    function createHTMLRequest(
        address scriptyStorage,
        RugData memory rug,
        uint8 dirtLevel,
        uint8 textureLevel,
        string memory frameLevel,
        uint256 tokenId
    ) internal pure returns (HTMLRequest memory htmlRequest) {
        // Check if we need frame script - ensure Bronze frames get frame algorithm
        bool hasFrame = keccak256(abi.encodePacked(frameLevel)) != keccak256(abi.encodePacked("None"));

        // Create head tags
        HTMLTag[] memory headTags = new HTMLTag[](1);
        headTags[0] = HTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: HTMLTagType.useTagOpenAndClose,
            tagOpen: bytes(string.concat(
                '<meta charset="utf-8">',
                '<meta name="viewport" content="width=device-width,initial-scale=1">',
                '<title>OnchainRug #', Strings.toString(tokenId), '</title>',
                '<style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;}</style>'
            )),
            tagClose: "",
            tagContent: ""
        });
        uint256 bodyTagCount = hasFrame ? 5 : 4;

        // Create body tags
        HTMLTag[] memory bodyTags = new HTMLTag[](bodyTagCount);

        // 1. p5.js library from ScriptyStorage (inline script)
        bodyTags[0] = HTMLTag({
            name: "rug-p5.js",
            contractAddress: scriptyStorage,
            contractData: abi.encode("rug-p5.js"),
            tagType: HTMLTagType.script,
            tagOpen: "",
            tagClose: "",
            tagContent: ""
        });

        // 2. Container div for p5.js canvas - needs to be before scripts that reference it
        bodyTags[1] = HTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: HTMLTagType.useTagOpenAndClose,
            tagOpen: '<div id="rug"></div>',
            tagClose: "",
            tagContent: ""
        });

        // 3. NFT-specific configuration script (inline)
        bodyTags[2] = HTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: HTMLTagType.script,
            tagOpen: "",
            tagClose: "",
            tagContent: bytes(generateRugConfig(rug, dirtLevel, textureLevel, frameLevel))
        });

        // 4. Algorithm script from ScriptyStorage (inline script)
        bodyTags[3] = HTMLTag({
            name: "rug-algo.js",
            contractAddress: scriptyStorage,
            contractData: abi.encode("rug-algo.js"),
            tagType: HTMLTagType.script,
            tagOpen: "",
            tagClose: "",
            tagContent: ""
        });

        // 5. Conditional frame script (only for rugs that qualify)
        if (hasFrame) {
            bodyTags[4] = HTMLTag({
                name: "rug-frame.js",
                contractAddress: scriptyStorage,
                contractData: abi.encode("rug-frame.js"),
                tagType: HTMLTagType.script,
                tagOpen: "",
                tagClose: "",
                tagContent: ""
            });
        }

        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;
    }
}
