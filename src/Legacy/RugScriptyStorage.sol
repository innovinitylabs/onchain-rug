// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////////////////////////////////////////////////
// ░██████╗░█████╔░██████╗░██╗██████╗░████████╗██╗░░░██╗ //
// ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗░██╔╝ //
// ╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░░╚████╔╝░ //
// ░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░░╚██╔╝░░ //
// ██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░░░░██║░░░ //
// ╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░░░░╚═╝░░░ //
///////////////////////////////////////////////////////////

interface RugScriptyStorage {
    // =============================================================
    //                            STRUCTS
    // =============================================================

    struct RugContent {
        bool isFrozen;
        address owner;
        uint256 size;
        bytes details;
        address[] chunks;
    }

    // =============================================================
    //                            ERRORS
    // =============================================================

    /**
     * @notice Error for, The content you are trying to create already exists
     */
    error RugContentExists();

    /**
     * @notice Error for, You dont have permissions to perform this action
     */
    error RugNotContentOwner();

    /**
     * @notice Error for, The content you are trying to edit is frozen
     */
    error RugContentIsFrozen(string name);

    // =============================================================
    //                            EVENTS
    // =============================================================

    /**
     * @notice Event for, Successful freezing of a content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     */
    event RugContentFrozen(string indexed name);

    /**
     * @notice Event for, Successful creation of a content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param details - Custom details of the content
     */
    event RugContentCreated(string indexed name, bytes details);

    /**
     * @notice Event for, Successful addition of content chunk
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param size - Bytes size of the chunk
     */
    event RugChunkStored(string indexed name, uint256 size);

    /**
     * @notice Event for, Successful update of custom details
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param details - Custom details of the content
     */
    event RugContentDetailsUpdated(string indexed name, bytes details);

    // =============================================================
    //                      MANAGEMENT OPERATIONS
    // =============================================================

    /**
     * @notice Create a new content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param details - Any details the owner wishes to store about the content
     *
     * Emits an {RugContentCreated} event.
     */
    function createContent(
        string calldata name,
        bytes calldata details
    ) external;

    /**
     * @notice Add a content chunk to the content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param chunk - Next sequential content chunk
     *
     * Emits an {RugChunkStored} event.
     */
    function addChunkToContent(
        string calldata name,
        bytes calldata chunk
    ) external;

    /**
     * @notice Update the frozen status of the content
     * @dev [WARNING] Once a content it frozen is can no longer be edited
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     *
     * Emits an {RugContentFrozen} event.
     */
    function freezeContent(
        string calldata name
    ) external;

    // =============================================================
    //                            GETTERS
    // =============================================================

    /**
     * @notice Get the full content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param data - Arbitrary data. Not used by this contract.
     * @return content - Full content from merged chunks
     */
    function getContent(string memory name, bytes memory data)
        external
        view
        returns (bytes memory content);

    /**
     * @notice Get content's chunk pointer list
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @return pointers - List of pointers
     */
    function getContentChunkPointers(
        string memory name
    ) external view returns (address[] memory pointers);
}
