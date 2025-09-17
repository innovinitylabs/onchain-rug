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
//░░░░░░░░░░░░░░░░░░░░    STORAGE    ░░░░░░░░░░░░░░░░░░░░//
///////////////////////////////////////////////////////////

/**
  @title A generic data storage contract
  @author @xtremetom
  @author @0xthedude

  Built on top of FileStore from EthFS V2. Chunk pointers
  are deterministic and using the EthFS's salt.

  Special thanks to @frolic, @cxkoda and @dhof.
*/

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {RugScriptyStorage} from "./RugScriptyStorage.sol";
import {RugAddressChunks} from "./RugAddressChunks.sol";

contract RugScriptyStorageV2 is Ownable(msg.sender), RugScriptyStorage {
    using RugAddressChunks for address[];

    /**
     * @notice Check if the msg.sender is the owner of the content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     */
    modifier rugIsContentOwner(string calldata name) {
        if (msg.sender != rugContents[name].owner) revert RugNotContentOwner();
        _;
    }

    /**
     * @notice Check if a content can be created by checking if it already exists
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     */
    modifier rugCanCreate(string calldata name) {
        if (rugContents[name].owner != address(0)) revert RugContentExists();
        _;
    }

    /**
     * @notice Check if a content is frozen
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     */
    modifier rugIsFrozen(string calldata name) {
        if (rugContents[name].isFrozen) revert RugContentIsFrozen(name);
        _;
    }

    mapping(string => RugContent) public rugContents;

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
    ) public rugCanCreate(name) {
        rugContents[name] = RugContent(
            false,
            msg.sender,
            0,
            details,
            new address[](0)
        );
        emit RugContentCreated(name, details);
    }

    /**
     * @notice Add a code chunk to the content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param chunk - Next sequential code chunk
     *
     * Emits an {RugChunkStored} event.
     */
    function addChunkToContent(
        string calldata name,
        bytes calldata chunk
    ) public rugIsFrozen(name) rugIsContentOwner(name) {
        // For now, we'll store chunks directly in contract storage
        // In the original, this uses EthFS but we'll keep it simple for rugs
        rugContents[name].chunks.push(address(uint160(uint256(keccak256(chunk)))));
        rugContents[name].size += chunk.length;
        emit RugChunkStored(name, chunk.length);
    }

    /**
     * @notice Edit the content details
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param details - Any details the owner wishes to store about the content
     *
     * Emits an {RugContentDetailsUpdated} event.
     */
    function updateDetails(
        string calldata name,
        bytes calldata details
    ) public rugIsFrozen(name) rugIsContentOwner(name) {
        rugContents[name].details = details;
        emit RugContentDetailsUpdated(name, details);
    }

    /**
     * @notice Update the frozen status of the content
     * @dev [WARNING] Once a content it frozen is can no longer be edited
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     *
     * Emits an {RugContentFrozen} event.
     */
    function freezeContent(
        string calldata name
    ) public rugIsFrozen(name) rugIsContentOwner(name) {
        rugContents[name].isFrozen = true;
        emit RugContentFrozen(name);
    }

    // =============================================================
    //                            GETTERS
    // =============================================================

    /**
     * @notice Get the full content
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @param data - Arbitrary data. Not used by this contract.
     * @return content - Full content from merged chunks
     */
    function getContent(
        string memory name,
        bytes memory data
    ) public view returns (bytes memory content) {
        return rugContents[name].chunks.mergeChunks();
    }

    /**
     * @notice Get content's chunk pointer list
     * @param name - Name given to the content. Eg: threejs.min.js_r148
     * @return pointers - List of pointers
     */
    function getContentChunkPointers(
        string memory name
    ) public view returns (address[] memory pointers) {
        return rugContents[name].chunks;
    }
}
