// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IRugScriptyContractStorage} from "../IRugScriptyContractStorage.sol";

///////////////////////////////////////////////////////////
// ░██████╗░█████╗░██████╗░██╗██████╗░████████╗██╗░░░██╗ //
// ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗░██╔╝ //
// ╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░░╚████╔╝░ //
// ░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░░╚██╔╝░░ //
// ██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░░░░██║░░░ //
// ╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░░░░╚═╝░░░ //
///////////////////////////////////////////////////////////
//░░░░░░░░░░░░░░░░░░░░░░░    ETHFS STORAGE    ░░░░░░░░░░░░░░░░░░░░░░//

/**
 * @title RugEthFSStorage
 * @notice On-chain storage for large JavaScript libraries using base64 data URIs
 * @dev Stores libraries as base64 strings and returns them as data:text/javascript URIs
 */
contract RugEthFSStorage is Ownable(msg.sender), IRugScriptyContractStorage {
    using Strings for uint256;

    // =============================================================
    //                            STRUCTS
    // =============================================================

    struct Library {
        string name;
        string base64Content;
        uint256 size;
        uint256 createdAt;
        address creator;
        bool isActive;
    }

    // =============================================================
    //                            STORAGE
    // =============================================================

    mapping(string => Library) public libraries;
    mapping(address => string[]) public creatorLibraries;
    string[] public libraryNames;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event LibraryStored(
        string indexed name,
        address indexed creator,
        uint256 size,
        uint256 timestamp
    );

    event LibraryUpdated(
        string indexed name,
        uint256 newSize,
        uint256 timestamp
    );

    event LibraryRemoved(
        string indexed name,
        address indexed remover,
        uint256 timestamp
    );

    // =============================================================
    //                            ERRORS
    // =============================================================

    error LibraryNotFound(string name);
    error LibraryAlreadyExists(string name);
    error EmptyLibrary();
    error UnauthorizedAccess();

    // =============================================================
    //                      LIBRARY MANAGEMENT
    // =============================================================

    /**
     * @notice Store a JavaScript library as base64
     * @param name Library name (e.g., "p5.min.js")
     * @param base64Content Base64 encoded JavaScript content
     */
    function storeLibrary(
        string calldata name,
        string calldata base64Content
    ) external {
        if (bytes(name).length == 0) revert EmptyLibrary();
        if (bytes(base64Content).length == 0) revert EmptyLibrary();
        if (libraries[name].creator != address(0)) revert LibraryAlreadyExists(name);

        libraries[name] = Library({
            name: name,
            base64Content: base64Content,
            size: bytes(base64Content).length,
            createdAt: block.timestamp,
            creator: msg.sender,
            isActive: true
        });

        creatorLibraries[msg.sender].push(name);
        libraryNames.push(name);

        emit LibraryStored(name, msg.sender, bytes(base64Content).length, block.timestamp);
    }

    /**
     * @notice Update an existing library (only creator or owner)
     * @param name Library name
     * @param base64Content New base64 encoded content
     */
    function updateLibrary(
        string calldata name,
        string calldata base64Content
    ) external {
        Library storage lib = libraries[name];
        if (lib.creator == address(0)) revert LibraryNotFound(name);
        if (msg.sender != lib.creator && msg.sender != owner()) revert UnauthorizedAccess();
        if (bytes(base64Content).length == 0) revert EmptyLibrary();

        lib.base64Content = base64Content;
        lib.size = bytes(base64Content).length;

        emit LibraryUpdated(name, bytes(base64Content).length, block.timestamp);
    }

    /**
     * @notice Remove a library (only creator or owner)
     * @param name Library name
     */
    function removeLibrary(string calldata name) external {
        Library storage lib = libraries[name];
        if (lib.creator == address(0)) revert LibraryNotFound(name);
        if (msg.sender != lib.creator && msg.sender != owner()) revert UnauthorizedAccess();

        lib.isActive = false;

        emit LibraryRemoved(name, msg.sender, block.timestamp);
    }

    // =============================================================
    //                            GETTERS
    // =============================================================

    /**
     * @notice Get library as data URI for direct HTML use
     * @param name Library name
     * @return dataUri Complete data:text/javascript;base64 URI
     */
    function getLibraryDataUri(string calldata name) external view returns (string memory dataUri) {
        Library storage lib = libraries[name];
        if (!lib.isActive || lib.creator == address(0)) revert LibraryNotFound(name);

        return string.concat(
            "data:text/javascript;base64,",
            lib.base64Content
        );
    }

    /**
     * @notice Get raw base64 content
     * @param name Library name
     * @return base64Content Raw base64 string
     */
    function getLibraryBase64(string calldata name) external view returns (string memory base64Content) {
        Library storage lib = libraries[name];
        if (!lib.isActive || lib.creator == address(0)) revert LibraryNotFound(name);

        return lib.base64Content;
    }

    /**
     * @notice Get the full content (implements IRugScriptyContractStorage)
     * @param name Library name
     * @param data Arbitrary data (unused)
     * @return script Base64 content as bytes
     */
    function getContent(string calldata name, bytes memory data)
        external
        view
        returns (bytes memory script)
    {
        Library storage lib = libraries[name];
        if (!lib.isActive || lib.creator == address(0)) revert LibraryNotFound(name);

        return bytes(lib.base64Content);
    }

    /**
     * @notice Get library metadata
     * @param name Library name
     * @return size Content size in bytes
     * @return createdAt Creation timestamp
     * @return creator Creator address
     * @return isActive Active status
     */
    function getLibraryInfo(string calldata name) external view returns (
        uint256 size,
        uint256 createdAt,
        address creator,
        bool isActive
    ) {
        Library storage lib = libraries[name];
        if (lib.creator == address(0)) revert LibraryNotFound(name);

        return (lib.size, lib.createdAt, lib.creator, lib.isActive);
    }

    // =============================================================
    //                      BATCH OPERATIONS
    // =============================================================

    /**
     * @notice Get all library names
     * @return names Array of all library names
     */
    function getAllLibraryNames() external view returns (string[] memory names) {
        return libraryNames;
    }

    /**
     * @notice Get libraries created by an address
     * @param creator Creator address
     * @return names Array of library names by this creator
     */
    function getCreatorLibraries(address creator) external view returns (string[] memory names) {
        return creatorLibraries[creator];
    }

    /**
     * @notice Get total number of libraries
     * @return count Total library count
     */
    function getLibraryCount() external view returns (uint256 count) {
        return libraryNames.length;
    }

    // =============================================================
    //                      UTILITY FUNCTIONS
    // =============================================================

    /**
     * @notice Check if library exists and is active
     * @param name Library name
     * @return exists True if library exists and is active
     */
    function libraryExists(string calldata name) external view returns (bool exists) {
        Library storage lib = libraries[name];
        return lib.creator != address(0) && lib.isActive;
    }

    /**
     * @notice Get storage statistics
     * @return totalLibraries Total number of libraries
     * @return totalSizeBytes Total size of all libraries in bytes
     * @return activeLibraries Number of active libraries
     */
    function getStorageStats() external view returns (
        uint256 totalLibraries,
        uint256 totalSizeBytes,
        uint256 activeLibraries
    ) {
        uint256 activeCount = 0;
        uint256 totalSize = 0;

        for (uint256 i = 0; i < libraryNames.length; i++) {
            Library storage lib = libraries[libraryNames[i]];
            if (lib.isActive) {
                activeCount++;
                totalSize += lib.size;
            }
        }

        return (libraryNames.length, totalSize, activeCount);
    }
}
