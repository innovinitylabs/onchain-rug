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
    struct RugData {
        uint256 seed;
        string paletteName;
        string minifiedPalette;
        string minifiedStripeData;
        string[] textRows;
        uint8 warpThickness;
        uint256 mintTime;
        string filteredCharacterMap;
        uint8 complexity;
        uint256 characterCount;
        uint256 stripeCount;
    }

    /**
     * @notice Generate HTML for OnchainRugs token
     * @param projectData Encoded RugData
     * @param tokenId The token ID
     * @param scriptyBuilder Address of ScriptyBuilderV2
     * @param scriptyStorage Address of ScriptyStorage
     * @return html Generated HTML string
     */
    function generateProjectHTML(
        bytes memory projectData,
        uint256 tokenId,
        address scriptyBuilder,
        address scriptyStorage
    ) external view override returns (string memory html) {
        RugData memory rug = abi.decode(projectData, (RugData));

        // Create HTML request using existing method
        HTMLRequest memory htmlRequest = createHTMLRequest(scriptyStorage, rug, tokenId);

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
        libraries = new string[](2);
        libraries[0] = "rug-p5.js.b64";
        libraries[1] = "rug-algorithm.js.b64";
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
    function generateRugConfig(RugData memory rug) internal view returns (string memory js) {
        // Calculate texture level based on complexity
        uint8 textureLevel = rug.complexity > 2 ? rug.complexity - 2 : 0;

        // Calculate dirt level based on time since mint (simplified version)
        uint8 dirtLevel = 0;
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        if (timeSinceMint > 7 days) {
            dirtLevel = 2;
        } else if (timeSinceMint > 3 days) {
            dirtLevel = 1;
        }

        return string.concat(
            'let w=800,h=1200,f=30,wt=8,wp=',
            rug.warpThickness.toString(),
            ',ts=2,lt,dt,p=',
            rug.minifiedPalette,
            ',sd=',
            rug.minifiedStripeData,
            ',tr=',
            encodeTextRows(rug.textRows),
            ',td=[],s=',
            rug.seed.toString(),
            ';let cm=',
            rug.filteredCharacterMap,
            ';tl=',
            textureLevel.toString(),
            ',dl=',
            dirtLevel.toString(),
            ';'
        );
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
     * @param tokenId The token ID
     * @return htmlRequest Properly structured HTML request for scripty
     */
    function createHTMLRequest(
        address scriptyStorage,
        RugData memory rug,
        uint256 tokenId
    ) internal view returns (HTMLRequest memory htmlRequest) {
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
                '<style>body{display:flex;justify-content:center;align-items:center}#rug{width:100%!important;height:auto!important;max-width:800px;max-height:1200px;}</style>'
            )),
            tagClose: "",
            tagContent: ""
        });

        // Create body tags
        HTMLTag[] memory bodyTags = new HTMLTag[](4);

        // 1. p5.js library from ScriptyStorage (base64 encoded)
        bodyTags[0] = HTMLTag({
            name: "rug-p5.js.b64",
            contractAddress: scriptyStorage,
            contractData: abi.encode("rug-p5.js.b64"),
            tagType: HTMLTagType.scriptBase64DataURI,
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
            tagContent: bytes(generateRugConfig(rug))
        });

        // 4. Algorithm script from ScriptyStorage
        bodyTags[3] = HTMLTag({
            name: "rug-algorithm.js.b64",
            contractAddress: scriptyStorage,
            contractData: abi.encode("rug-algorithm.js.b64"),
            tagType: HTMLTagType.scriptBase64DataURI,
            tagOpen: "",
            tagClose: "",
            tagContent: ""
        });

        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;
    }
}
