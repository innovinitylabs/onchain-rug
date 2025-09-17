// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {RugHTMLRequest, RugHTMLTag, RugHTMLTagType} from "./RugScriptyStructs.sol";
import {IRugScriptyBuilderV2} from "./IRugScriptyBuilderV2.sol";
import {IProjectHTMLGenerator} from "./IProjectHTMLGenerator.sol";

///////////////////////////////////////////////////////////
// ░██████╗░█████╗░██████╗░██╗██████╗░████████╗██╗░░░██╗ //
// ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗░██╔╝ //
// ╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░░╚████╔╝░ //
// ░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░░╚██╔╝░░ //
// ██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░░░░██║░░░ //
// ╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░░░░╚═╝░░░ //
///////////////////////////////////////////////////////////
//░░░░░░░░░░░░░░░░░░░░░░░    AGNOSTIC HTML    ░░░░░░░░░░░░░░░░░░░░░░//

/**
 * @title RugHTMLGeneratorAgnostic
 * @notice Generic HTML generator using scripty.sol system
 * @dev Project-agnostic, works with any IProjectHTMLGenerator implementation
 */
library RugHTMLGeneratorAgnostic {
    using Strings for uint256;

    /**
     * @notice Generate HTML using any project-specific generator
     * @param projectGenerator Address of the project-specific HTML generator
     * @param projectData Encoded project-specific data
     * @param tokenId The token ID
     * @param scriptyBuilder Address of RugScriptyBuilderV2
     * @param ethfsStorage Address of RugEthFSStorage
     * @return html Generated HTML string
     */
    function generateHTML(
        address projectGenerator,
        bytes memory projectData,
        uint256 tokenId,
        address scriptyBuilder,
        address ethfsStorage
    ) internal view returns (string memory html) {
        return IProjectHTMLGenerator(projectGenerator).generateProjectHTML(
            projectData,
            tokenId,
            scriptyBuilder,
            ethfsStorage
        );
    }

    /**
     * @notice Generate HTML with library validation
     * @param projectGenerator Address of the project-specific HTML generator
     * @param projectData Encoded project-specific data
     * @param tokenId The token ID
     * @param scriptyBuilder Address of RugScriptyBuilderV2
     * @param ethfsStorage Address of RugEthFSStorage
     * @return html Generated HTML string
     * @return requiredLibs Array of required library names
     */
    function generateHTMLWithValidation(
        address projectGenerator,
        bytes memory projectData,
        uint256 tokenId,
        address scriptyBuilder,
        address ethfsStorage
    ) internal view returns (string memory html, string[] memory requiredLibs) {
        requiredLibs = IProjectHTMLGenerator(projectGenerator).getRequiredLibraries();

        html = IProjectHTMLGenerator(projectGenerator).generateProjectHTML(
            projectData,
            tokenId,
            scriptyBuilder,
            ethfsStorage
        );
    }

    /**
     * @notice Get project metadata
     * @param projectGenerator Address of the project-specific HTML generator
     * @return name Project name
     * @return description Project description
     */
    function getProjectMetadata(
        address projectGenerator
    ) internal view returns (string memory name, string memory description) {
        name = IProjectHTMLGenerator(projectGenerator).getProjectName();
        description = IProjectHTMLGenerator(projectGenerator).getProjectDescription();
    }

    /**
     * @notice Validate that all required libraries exist in storage
     * @param projectGenerator Address of the project-specific HTML generator
     * @param ethfsStorage Address of RugEthFSStorage
     * @return allValid True if all required libraries are available
     * @return missingLibs Array of missing library names
     */
    function validateRequiredLibraries(
        address projectGenerator,
        address ethfsStorage
    ) internal view returns (bool allValid, string[] memory missingLibs) {
        string[] memory requiredLibs = IProjectHTMLGenerator(projectGenerator).getRequiredLibraries();

        // This would need to be implemented with a libraryExists function
        // For now, return empty arrays
        allValid = true;
        missingLibs = new string[](0);
    }

    /**
     * @notice Create a basic HTML structure for projects
     * @param title Page title
     * @param libraries Array of library names to include
     * @param bodyContent HTML body content
     * @param scriptyBuilder Address of RugScriptyBuilderV2
     * @param ethfsStorage Address of RugEthFSStorage
     * @return html Complete HTML string
     */
    function createBasicHTML(
        string memory title,
        string[] memory libraries,
        string memory bodyContent,
        address scriptyBuilder,
        address ethfsStorage
    ) internal view returns (string memory html) {
        // Create head tags
        RugHTMLTag[] memory headTags = new RugHTMLTag[](1);
        headTags[0].tagOpen = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>';
        headTags[0].tagContent = bytes(title);
        headTags[0].tagClose = '</title><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style>';

        // Create body tags
        uint256 bodyTagCount = libraries.length + 1; // libraries + body content
        RugHTMLTag[] memory bodyTags = new RugHTMLTag[](bodyTagCount);

        // Add library scripts
        for (uint256 i = 0; i < libraries.length; i++) {
            bodyTags[i].name = libraries[i];
            bodyTags[i].contractAddress = ethfsStorage;
            bodyTags[i].contractData = abi.encode(libraries[i]);
            bodyTags[i].tagType = RugHTMLTagType.scriptBase64DataURI;
        }

        // Add body content
        bodyTags[libraries.length].tagOpen = '<div id="content">';
        bodyTags[libraries.length].tagContent = bytes(bodyContent);
        bodyTags[libraries.length].tagClose = '</div>';

        // Create HTML request
        RugHTMLRequest memory htmlRequest;
        htmlRequest.headTags = headTags;
        htmlRequest.bodyTags = bodyTags;

        // Generate HTML
        return IRugScriptyBuilderV2(scriptyBuilder).getHTMLURLSafeString(htmlRequest);
    }
}
