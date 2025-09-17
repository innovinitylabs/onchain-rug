// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {RugHTMLRequest, RugHTMLTag, RugHTMLTagType} from "./RugScriptyStructs.sol";
import {IRugScriptyBuilderV2} from "./IRugScriptyBuilderV2.sol";
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
     * @param scriptyBuilder Address of RugScriptyBuilderV2
     * @param ethfsStorage Address of RugEthFSStorage
     * @return html Generated HTML string
     */
    function generateProjectHTML(
        bytes memory projectData,
        uint256 tokenId,
        address scriptyBuilder,
        address ethfsStorage
    ) external view override returns (string memory html) {
        RugData memory rug = abi.decode(projectData, (RugData));

        // Create head tags
        RugHTMLTag[] memory headTags = new RugHTMLTag[](1);
        headTags[0].tagOpen = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OnchainRug #';
        headTags[0].tagContent = bytes(tokenId.toString());
        headTags[0].tagClose = '</title><style>body{display:flex;justify-content:center;align-items:center}#defaultCanvas0{width:100%!important;height:auto!important;max-width:800px;max-height:1200px;}</style>';

        // Create body tags (4 total: p5.js, algorithm, canvas, rug-specific JS)
        RugHTMLTag[] memory bodyTags = new RugHTMLTag[](4);

        // 1. p5.js library from EthFS storage (gzipped)
        bodyTags[0].name = "p5.min.js.gz";
        bodyTags[0].contractAddress = ethfsStorage;
        bodyTags[0].contractData = abi.encode("p5.min.js.gz");
        bodyTags[0].tagType = RugHTMLTagType.scriptGZIPBase64DataURI;

        // 2. Rug algorithm from EthFS storage
        bodyTags[1].name = "rug-algorithm.js";
        bodyTags[1].contractAddress = ethfsStorage;
        bodyTags[1].contractData = abi.encode("rug-algorithm.js");
        bodyTags[1].tagType = RugHTMLTagType.scriptBase64DataURI;

        // 3. Canvas element
        bodyTags[2].tagOpen = '<div id="rug"></div>';

        // 4. Rug-specific JavaScript (configuration)
        bodyTags[3].tagContent = bytes(generateRugConfig(rug));
        bodyTags[3].tagType = RugHTMLTagType.script;

        // Create HTML request
        RugHTMLRequest memory htmlRequest;
        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;

        // Generate URL safe HTML
        return IRugScriptyBuilderV2(scriptyBuilder).getHTMLURLSafeString(htmlRequest);
    }

    /**
     * @notice Get required JavaScript libraries for OnchainRugs
     * @return libraries Array of required library names
     */
    function getRequiredLibraries() external pure override returns (string[] memory libraries) {
        libraries = new string[](2);
        libraries[0] = "p5.min.js.gz";
        libraries[1] = "rug-algorithm.js";
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
    function generateRugConfig(RugData memory rug) internal pure returns (string memory js) {
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
}
