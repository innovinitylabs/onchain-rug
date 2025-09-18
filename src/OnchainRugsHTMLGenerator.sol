// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {RugHTMLRequest, RugHTMLTag, RugHTMLTagType} from "./RugScriptyStructs.sol";
import {RugScriptyCore} from "./RugScriptyCore.sol";
import {RugScriptyHTML} from "./RugScriptyHTML.sol";
import {IRugScriptyContractStorage} from "./IRugScriptyContractStorage.sol";
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

        // Create HTML request using existing method
        RugHTMLRequest memory htmlRequest = createHTMLRequest(ethfsStorage, rug, tokenId);

        // Use RugScripty to generate HTML (raw HTML, not URL-safe)
        bytes memory rawHTML = IRugScriptyBuilderV2(scriptyBuilder).getHTML(htmlRequest);

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

    /**
     * @notice Create HTML request for RugScriptyHTML with proper tag structure
     * @param ethfsStorage Address of RugEthFSStorage
     * @param rug Rug data
     * @param tokenId The token ID
     * @return htmlRequest Properly structured HTML request for scripty
     */
    function createHTMLRequest(
        address ethfsStorage,
        RugData memory rug,
        uint256 tokenId
    ) internal view returns (RugHTMLRequest memory htmlRequest) {
        // Create head tags
        RugHTMLTag[] memory headTags = new RugHTMLTag[](1);
        headTags[0] = RugHTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: RugHTMLTagType.useTagOpenAndClose,
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
        RugHTMLTag[] memory bodyTags = new RugHTMLTag[](4);

        // 1. p5.js library from EthFS storage (base64 encoded)
        bodyTags[0] = RugHTMLTag({
            name: "p5.min.js.gz",
            contractAddress: ethfsStorage,
            contractData: abi.encode("p5.min.js.gz"),
            tagType: RugHTMLTagType.scriptGZIPBase64DataURI,
            tagOpen: "",
            tagClose: "",
            tagContent: ""
        });

        // 2. Rug algorithm from EthFS storage
        bodyTags[1] = RugHTMLTag({
            name: "rug-algorithm.js",
            contractAddress: ethfsStorage,
            contractData: abi.encode("rug-algorithm.js"),
            tagType: RugHTMLTagType.scriptGZIPBase64DataURI,
            tagOpen: "",
            tagClose: "",
            tagContent: ""
        });

        // 3. Container div for p5.js canvas
        bodyTags[2] = RugHTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: RugHTMLTagType.useTagOpenAndClose,
            tagOpen: '<div id="rug"></div>',
            tagClose: "",
            tagContent: ""
        });

        // 4. Configuration script (inline)
        bodyTags[3] = RugHTMLTag({
            name: "",
            contractAddress: address(0),
            contractData: "",
            tagType: RugHTMLTagType.script,
            tagOpen: "",
            tagClose: "",
            tagContent: bytes(generateRugConfig(rug))
        });

        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;
    }
}
