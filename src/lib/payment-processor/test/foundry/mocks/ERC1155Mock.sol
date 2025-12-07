// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../utils/ERC2981.sol";

contract ERC1155Mock is Ownable, ERC1155, ERC2981 {

    error ExceedsMaxRoyaltyFee();
    
    constructor() ERC1155("") {}

    function mintTo(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }

    function setDefaultRoyaltyInfo(address receiver, uint96 feeNumerator) public {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override (ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}