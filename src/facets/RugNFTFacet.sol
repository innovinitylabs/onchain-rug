// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";

/**
 * @title RugNFTFacet
 * @notice ERC721 facet for OnchainRugs NFT functionality
 * @dev Handles minting, token management, and ERC721 compliance
 */
contract RugNFTFacet is ERC721, ERC721URIStorage {
    using Strings for uint256;

    // Events
    event RugMinted(uint256 indexed tokenId, address indexed owner, string[] textRows, uint256 seed);
    event RugBurned(uint256 indexed tokenId, address indexed owner);

    constructor() ERC721("OnchainRugs", "RUGS") {}

    /**
     * @notice Mint a new rug NFT
     * @param textRows Array of text lines (1-5)
     * @param seed Random seed for generation
     * @param paletteName Color palette identifier
     * @param minifiedPalette Compressed palette data
     * @param minifiedStripeData Compressed stripe data
     * @param filteredCharacterMap Character usage map
     * @param warpThickness Design parameter
     * @param complexity Pattern complexity
     * @param characterCount Total characters
     * @param stripeCount Number of stripes
     */
    function mintRug(
        string[] calldata textRows,
        uint256 seed,
        string calldata paletteName,
        string calldata minifiedPalette,
        string calldata minifiedStripeData,
        string calldata filteredCharacterMap,
        uint8 warpThickness,
        uint8 complexity,
        uint256 characterCount,
        uint256 stripeCount
    ) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Basic validation
        require(textRows.length > 0 && textRows.length <= 5, "Invalid text length");
        require(warpThickness >= 1 && warpThickness <= 5, "Invalid warp thickness");
        require(LibRugStorage.canMintSupply(), "Max supply reached");
        require(LibRugStorage.canMint(msg.sender), "Wallet limit exceeded");

        // Text uniqueness check
        require(LibRugStorage.isTextAvailable(textRows), "Text already used");

        // Pricing validation
        uint256 price = LibRugStorage.calculateMintPrice(textRows.length);
        require(msg.value >= price, "Insufficient payment");

        // Generate seed if not provided
        if (seed == 0) {
            seed = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                rs.tokenCounter
            )));
        }

        // Get next token ID
        uint256 tokenId = LibRugStorage.nextTokenId();

        // Store rug data
        rs.rugs[tokenId] = LibRugStorage.RugData({
            seed: seed,
            textRows: textRows,
            paletteName: paletteName,
            minifiedPalette: minifiedPalette,
            minifiedStripeData: minifiedStripeData,
            warpThickness: warpThickness,
            mintTime: block.timestamp,
            filteredCharacterMap: filteredCharacterMap,
            complexity: complexity,
            characterCount: characterCount,
            stripeCount: stripeCount
        });

        // Initialize aging data
        rs.agingData[tokenId] = LibRugStorage.AgingData({
            lastCleaned: block.timestamp,
            lastSalePrice: 0,
            recentSalePrices: [uint256(0), 0, 0],
            dirtLevel: 0,
            textureLevel: 0
        });

        // Mark text as used and record mint
        LibRugStorage.markTextAsUsed(textRows);
        LibRugStorage.recordMint(msg.sender);

        // Mint NFT
        _safeMint(msg.sender, tokenId);

        emit RugMinted(tokenId, msg.sender, textRows, seed);
    }

    /**
     * @notice Burn a rug NFT (only owner)
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Clear data
        delete rs.rugs[tokenId];
        delete rs.agingData[tokenId];
        rs.totalSupply--;

        _burn(tokenId);

        emit RugBurned(tokenId, msg.sender);
    }

    /**
     * @notice Get rug data
     * @param tokenId Token ID
     * @return Rug data struct
     */
    function getRugData(uint256 tokenId) external view returns (LibRugStorage.RugData memory) {
        require(_exists(tokenId), "Token does not exist");
        return LibRugStorage.rugStorage().rugs[tokenId];
    }

    /**
     * @notice Get aging data
     * @param tokenId Token ID
     * @return Aging data struct
     */
    function getAgingData(uint256 tokenId) external view returns (LibRugStorage.AgingData memory) {
        require(_exists(tokenId), "Token does not exist");
        return LibRugStorage.rugStorage().agingData[tokenId];
    }

    /**
     * @notice Get total supply
     * @return Current total supply
     */
    function totalSupply() external view returns (uint256) {
        return LibRugStorage.rugStorage().totalSupply;
    }

    /**
     * @notice Get max supply
     * @return Maximum collection size
     */
    function maxSupply() external view returns (uint256) {
        return LibRugStorage.rugStorage().collectionCap;
    }

    /**
     * @notice Check if text combination is available
     * @param textLines Array of text lines
     * @return True if available
     */
    function isTextAvailable(string[] calldata textLines) external view returns (bool) {
        return LibRugStorage.isTextAvailable(textLines);
    }

    /**
     * @notice Get mint price for given text length
     * @param lineCount Number of text lines
     * @return Price in wei
     */
    function getMintPrice(uint256 lineCount) external view returns (uint256) {
        return LibRugStorage.calculateMintPrice(lineCount);
    }

    /**
     * @notice Check if address can mint
     * @param account Address to check
     * @return True if can mint
     */
    function canMint(address account) external view returns (bool) {
        return LibRugStorage.canMint(account);
    }

    /**
     * @notice Get wallet mint count
     * @param account Address to check
     * @return Number of mints by this wallet
     */
    function walletMints(address account) external view returns (uint256) {
        return LibRugStorage.rugStorage().walletMints[account];
    }

    /**
     * @notice Check if address is exempt from wallet limits
     * @param account Address to check
     * @return True if exempt
     */
    function isWalletException(address account) external view returns (bool) {
        return LibRugStorage.isException(account);
    }

    // ERC721 overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        LibRugStorage.RugData memory rug = LibRugStorage.rugStorage().rugs[tokenId];

        // Create basic metadata (will be enhanced by other facets)
        string memory json = string(abi.encodePacked(
            '{"name": "OnchainRug #', tokenId.toString(),
            '","description": "A unique onchain rug with dynamic aging mechanics",',
            '"attributes": [',
            '{"trait_type": "Text Lines", "value": "', rug.textRows.length.toString(), '"},',
            '{"trait_type": "Palette", "value": "', rug.paletteName, '"},',
            '{"trait_type": "Complexity", "value": "', uint256(rug.complexity).toString(), '"}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }
}
