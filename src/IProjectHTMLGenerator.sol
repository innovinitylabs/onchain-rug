// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

///////////////////////////////////////////////////////////
// ░██████╗░█████╗░██████╗░██╗██████╗░████████╗██╗░░░██╗ //
// ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗░██╔╝ //
// ╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░░╚████╔╝░ //
// ░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░░╚██╔╝░░ //
// ██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░░░░██║░░░ //
// ╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░░░░╚═╝░░░ //
///////////////////////////////////////////////////////////
//░░░░░░░░░░░░░░░░░░░░░░░    PROJECT HTML    ░░░░░░░░░░░░░░░░░░░░░░//
/////////////////////////////////////////////////////////////////////////////////////////////////
/// ██╗   ██╗ █████╗ ██╗     ██╗██████╗  ██████╗ ██╗  ██╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗ ///
/// ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔═══██╗██║ ██╔╝██║ ██╔╝██╔══██╗████╗  ██║████╗  ██║ ///
/// ██║   ██║███████║██║     ██║██████╔╝██║   ██║█████╔╝ █████╔╝ ███████║██╔██╗ ██║██╔██╗ ██║ ///
/// ╚██╗ ██╔╝██╔══██║██║     ██║██╔═══╝ ██║   ██║██╔═██╗ ██╔═██╗ ██╔══██║██║╚██╗██║██║╚██╗██║ ///
///  ╚████╔╝ ██║  ██║███████╗██║██║     ╚██████╔╝██║  ██╗██║  ██╗██║  ██║██║ ╚████║██║ ╚████║ ///
///   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ///
/////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @title IProjectHTMLGenerator
 * @notice Generic interface for project-specific HTML generation using scripty.sol
 * @dev Any NFT project can implement this to use the RugScripty system
 */
interface IProjectHTMLGenerator {
    /**
     * @notice Generate HTML for a specific token using project-specific data
     * @param projectData Encoded project-specific data (e.g., RugData for OnchainRugs)
     * @param tokenId The token ID
     * @param dirtLevel Current dirt level (0-2)
     * @param textureLevel Current texture level (0-10)
     * @param frameLevel Frame level string ("None", "Bronze", "Silver", "Gold", "Diamond")
     * @param scriptyBuilder Address of ScriptyBuilderV2
     * @param ethfsStorage Address of EthFS storage contract
     * @return html Generated HTML string
     */
    function generateProjectHTML(
        bytes memory projectData,
        uint256 tokenId,
        uint8 dirtLevel,
        uint8 textureLevel,
        string memory frameLevel,
        address scriptyBuilder,
        address ethfsStorage
    ) external view returns (string memory html);

    /**
     * @notice Get project-specific JavaScript libraries needed
     * @return libraries Array of library names stored in EthFS
     */
    function getRequiredLibraries() external view returns (string[] memory libraries);

    /**
     * @notice Get project name for metadata
     * @return name Human-readable project name
     */
    function getProjectName() external view returns (string memory name);

    /**
     * @notice Get project description for metadata
     * @return description Human-readable project description
     */
    function getProjectDescription() external view returns (string memory description);
}
