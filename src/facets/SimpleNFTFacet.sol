// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibTransferSecurity} from "../libraries/LibTransferSecurity.sol";

/**
 * @title SimpleNFTFacet
 * @notice Simple ERC721 facet for testing ERC721-C integration
 * @dev Minimal implementation to test transfer validation
 */
contract SimpleNFTFacet is ERC721 {

    uint256 private _tokenCounter;

    // Events
    event RugMinted(uint256 indexed tokenId, address indexed owner, string[] textRows, uint256 seed);

    constructor() ERC721("OnchainRugs", "RUGS") {}

    /**
     * @notice Mint a simple test NFT
     */
    function mint() external returns (uint256 tokenId) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.tokenCounter++;
        tokenId = rs.tokenCounter;

        // Minimal data storage
        rs.rugs[tokenId].seed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId)));
        rs.rugs[tokenId].mintTime = block.timestamp;

        _safeMint(msg.sender, tokenId);
    }

    // Structs to reduce stack depth
    struct VisualConfig {
        uint8 warpThickness;    // Required for HTML generation
        uint256 stripeCount;    // Number of stripes
    }

    struct ArtData {
        string paletteName;           // Palette identifier
        string minifiedPalette;       // Compressed palette colors
        string minifiedStripeData;    // Essential for art generation
        string filteredCharacterMap;  // Required for HTML generation
    }

    /**
     * @notice Mint a rug NFT with full production parameters (ERC721-C compatible)
     * @dev Uses structs to avoid stack overflow with 8+ parameters
     */
    function mintRug(
        string[] calldata textRows,      // REQUIRED: The text to display
        uint256 seed,                   // Optional: 0 = auto-generate
        VisualConfig calldata visual,   // Visual configuration
        ArtData calldata art            // Art generation data
    ) external payable returns (uint256 tokenId) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Validation
        require(textRows.length > 0 && textRows.length <= 5, "Invalid text length");
        require(visual.warpThickness >= 1 && visual.warpThickness <= 5, "Invalid warp thickness");

        rs.tokenCounter++;
        tokenId = rs.tokenCounter;

        // Generate seed if needed
        if (seed == 0) {
            seed = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId)));
        }

        // Store all rug data
        rs.rugs[tokenId] = LibRugStorage.RugData({
            seed: seed,
            textRows: textRows,
            paletteName: art.paletteName,
            minifiedPalette: art.minifiedPalette,
            minifiedStripeData: art.minifiedStripeData,
            warpThickness: visual.warpThickness,
            mintTime: block.timestamp,
            filteredCharacterMap: art.filteredCharacterMap,
            complexity: 1,  // Default complexity
            characterCount: 0,  // Can be calculated later
            stripeCount: visual.stripeCount
        });

        // Initialize aging data
        rs.agingData[tokenId] = LibRugStorage.AgingData({
            lastCleaned: block.timestamp,
            dirtLevel: 0,
            agingLevel: 0,
            frameLevel: 0,
            frameAchievedTime: 0,
            cleaningCount: 0,
            restorationCount: 0,
            masterRestorationCount: 0,
            launderingCount: 0,
            lastLaundered: 0,
            lastSalePrice: 0,
            recentSalePrices: [uint256(0), 0, 0]
        });

        _safeMint(msg.sender, tokenId);

        emit RugMinted(tokenId, msg.sender, textRows, seed);
    }

    /**
     * @notice Burn a test NFT
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
    }

    /**
     * @notice Get token URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");

        string memory json = string.concat(
            '{"name": "SimpleRug #',
            Strings.toString(tokenId),
            '", "description": "Simple ERC721-C test NFT", "attributes": []}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /// @dev Override OpenZeppelin ERC721 _beforeTokenTransfer for ERC721-C validation
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        // Call ERC721CFacet for transfer validation
        // This is a delegatecall to the ERC721CFacet
        (bool success,) = address(this).delegatecall(
            abi.encodeWithSignature("validateTransfer(address,address,uint256)", from, to, tokenId)
        );
        // We don't revert on failure here as the ERC721CFacet will handle validation
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721) returns (bool) {
        // Check for ICreatorToken interface support via ERC721CFacet
        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodeWithSignature("supportsERC721CInterface(bytes4)", interfaceId)
        );
        if (success && abi.decode(data, (bool))) {
            return true;
        }
        return super.supportsInterface(interfaceId);
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return ownerOf(tokenId) != address(0);
    }
}
