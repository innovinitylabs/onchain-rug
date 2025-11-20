// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

contract MockDiamondContract {
    uint256 private _diamondFrameCount;
    mapping(uint256 => address) private _owners;
    mapping(uint256 => bool) private _hasDiamondFrame;
    uint256[] private _diamondFrameTokenIds;

    function setDiamondFrameCount(uint256 count) external {
        _diamondFrameCount = count;
    }

    function setOwnerOf(uint256 tokenId, address owner) external {
        _owners[tokenId] = owner;
    }

    function setHasDiamondFrame(uint256 tokenId, bool hasFrame) external {
        _hasDiamondFrame[tokenId] = hasFrame;
        if (hasFrame) {
            _diamondFrameTokenIds.push(tokenId);
        }
    }

    // Functions that the pool contract calls
    function getDiamondFrameCount() external view returns (uint256) {
        return _diamondFrameCount;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _owners[tokenId];
    }

    function hasDiamondFrame(uint256 tokenId) external view returns (bool) {
        return _hasDiamondFrame[tokenId];
    }

    function getDiamondFrameTokenIds() external view returns (uint256[] memory) {
        return _diamondFrameTokenIds;
    }

    // ERC721 interface functions (if needed)
    function balanceOf(address owner) external pure returns (uint256) {
        return 1; // Mock implementation
    }

    function getApproved(uint256 tokenId) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address owner, address operator) external pure returns (bool) {
        return false;
    }
}
