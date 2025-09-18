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

import {IFileStore} from "./ethfs/IFileStore.sol";
import {IRugScriptyContractStorage} from "./IRugScriptyContractStorage.sol";

contract ETHFSV2FileStorage is IRugScriptyContractStorage {
    IFileStore public immutable fileStore;

    constructor(address _fileStoreAddress) {
        fileStore = IFileStore(_fileStoreAddress);
    }

    // =============================================================
    //                            GETTERS
    // =============================================================

    /**
     * @notice Get the full file from ethfs's FileStore contract
     * @param name - Name given to the file. Eg: threejs.min.js_r148
     * @param data - Arbitrary data. Not used by this contract.
     * @return script - Full file from merged chunks
     */
    function getContent(
        string calldata name,
        bytes memory data
    ) external view returns (bytes memory script) {
        return bytes(fileStore.getFile(name).read());
    }
}
