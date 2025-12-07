// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../utils/ERC2981.sol";

contract ERC721Mock is Ownable, ERC721, ERC2981 {

    error ExceedsMaxRoyaltyFee();
    
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mintTo(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function setDefaultRoyaltyInfo(address receiver, uint96 feeNumerator) public {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override (ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}