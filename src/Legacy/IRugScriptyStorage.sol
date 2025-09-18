// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////////////////////////////////////////////////
// ░██████╗░█████╗░██████╗░██╗██████╗░████████╗██╗░░░██╗ //
// ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗░██╔╝ //
// ╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░░╚████╔╝░ //
// ░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░░╚██╔╝░░ //
// ██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░░░░██║░░░ //
// ╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░░░░╚═╝░░░ //
///////////////////////////////////////////////////////////

interface IRugScriptyStorage {
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

    /**
     * @notice Event for, submitting content to EthFS FileStore
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param fileName - Name given to the file in File Store.
     */
    event RugContentSubmittedToEthFSFileStore(string indexed name, string indexed fileName);

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
     * @notice Submit content to EthFS V2 FileStore
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param metadata - metadata for EthFS V2 File
     *
     * Uses name as file name.
     * Emits an {RugContentSubmittedToEthFSFileStore} event.
     */
    function submitToEthFSFileStore(
        string calldata name,
        bytes memory metadata
    ) external;

    /**
     * @notice Submit content to EthFS V2 FileStore
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param fileName - Name given to the File in FileStore
     * @param metadata - metadata for EthFS V2 File
     *
     * Emits an {RugContentSubmittedToEthFSFileStore} event.
     */
    function submitToEthFSFileStoreWithFileName(
        string calldata name,
        string calldata fileName,
        bytes memory metadata
    ) external;
}
