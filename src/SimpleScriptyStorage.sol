// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./scripty/interfaces/IScriptyContractStorage.sol";

/**
 * @title SimpleScriptyStorage
 * @dev Simplified storage contract that stores content directly without EthFS
 * @notice Implements IScriptyContractStorage for compatibility with Scripty system
 */
contract SimpleScriptyStorage is Ownable, IScriptyContractStorage {
    struct Content {
        bool isFrozen;
        address owner;
        uint256 size;
        bytes data;
    }

    mapping(string => Content) public contents;

    event ContentCreated(string name, bytes details);
    event ContentUpdated(string name);
    event ContentFrozen(string name);

    modifier isContentOwner(string memory name) {
        require(contents[name].owner == msg.sender, "Not content owner");
        _;
    }

    modifier isFrozen(string memory name) {
        require(!contents[name].isFrozen, "Content is frozen");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create new content
     * @param name Content name
     * @param data Content data
     */
    function createContent(string calldata name, bytes calldata data) external {
        require(contents[name].owner == address(0), "Content already exists");

        contents[name] = Content({
            isFrozen: false,
            owner: msg.sender,
            size: data.length,
            data: data
        });

        emit ContentCreated(name, "");
    }

    /**
     * @notice Get content data
     * @param name Content name
     * @param data Unused parameter for compatibility
     * @return Content data
     */
    function getContent(string calldata name, bytes memory data)
        external
        view
        returns (bytes memory)
    {
        Content memory content = contents[name];
        require(content.owner != address(0), "Content does not exist");
        return content.data;
    }

    /**
     * @notice Freeze content
     * @param name Content name
     */
    function freezeContent(string calldata name) external isContentOwner(name) {
        contents[name].isFrozen = true;
        emit ContentFrozen(name);
    }
}
