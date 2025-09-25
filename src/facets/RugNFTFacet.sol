// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {OnchainRugsHTMLGenerator} from "../OnchainRugsHTMLGenerator.sol";

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
            lastTextureReset: block.timestamp, // Initialize texture timer to mint time
            lastSalePrice: 0,
            recentSalePrices: [uint256(0), 0, 0],
            dirtLevel: 0, // deprecated, will be calculated
            textureLevel: 0, // deprecated, will be calculated
            launderingCount: 0, // Never laundered initially
            lastLaundered: 0, // Never laundered initially
            cleaningCount: 0, // Never cleaned initially
            restorationCount: 0, // Never restored initially
            masterRestorationCount: 0, // Never master restored initially
            maintenanceScore: 0 // Initial maintenance score
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
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData memory rug = rs.rugs[tokenId];

        // Get current dirt and texture levels
        uint8 dirtLevel = _getDirtLevel(tokenId);
        uint8 textureLevel = _getTextureLevel(tokenId);

        // Use Scripty system - now mandatory
        require(rs.rugScriptyBuilder != address(0), "ScriptyBuilder not configured");
        require(rs.rugEthFSStorage != address(0), "EthFS storage not configured");
        require(rs.onchainRugsHTMLGenerator != address(0), "HTML generator not configured");

        // Encode rug data for the HTML generator
        // Use abi.encode to match the RugData struct in OnchainRugsHTMLGenerator
        bytes memory encodedRugData = abi.encode(rug);

        string memory frameLevel = _getFrameLevel(tokenId);

        string memory html = OnchainRugsHTMLGenerator(rs.onchainRugsHTMLGenerator).generateProjectHTML(
            encodedRugData,
            tokenId,
            dirtLevel,
            textureLevel,
            frameLevel,
            rs.rugScriptyBuilder,
            rs.rugEthFSStorage
        );

        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"OnchainRug #', tokenId.toString(),
                        '","description":"OnchainRugs by valipokkann","image":"https://onchainrugs.xyz/logo.png","animation_url":"',
                        html,  // HTML generator now returns complete data URI
                        '","attributes":[{"trait_type":"Text Lines","value":"', rug.textRows.length.toString(),
                        '"},{"trait_type":"Character Count","value":"', rug.characterCount.toString(),
                        '"},{"trait_type":"Palette Name","value":"', rug.paletteName,
                        '"},{"trait_type":"Stripe Count","value":"', rug.stripeCount.toString(),
                        '"},{"trait_type":"Complexity","value":"', uint256(rug.complexity).toString(),
                        '"},{"trait_type":"Warp Thickness","value":"', uint256(rug.warpThickness).toString(),
                        '"},{"trait_type":"Dirt Level","value":"', uint256(dirtLevel).toString(),
                        '"},{"trait_type":"Texture Level","value":"', uint256(textureLevel).toString(),
                        '"},{"trait_type":"Cleaning Count","value":"', aging.cleaningCount.toString(),
                        '"},{"trait_type":"Restoration Count","value":"', aging.restorationCount.toString(),
                        '"},{"trait_type":"Master Restoration Count","value":"', aging.masterRestorationCount.toString(),
                        '"},{"trait_type":"Laundering Count","value":"', aging.launderingCount.toString(),
                        '"},{"trait_type":"Maintenance Score","value":"', _calculateMaintenanceScore(tokenId).toString(),
                        '"},{"trait_type":"Frame Level","value":"', _getFrameLevel(tokenId),
                        '"}]}'
                    )
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    // Internal helper functions
    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (timeSinceCleaned >= rs.dirtLevel2Days) return 2;
        if (timeSinceCleaned >= rs.dirtLevel1Days) return 1;
        return 0;
    }

    function _getTextureLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Texture level based on time since last texture reset (totally independent of dirt maintenance)
        uint256 timeSinceTextureReset = block.timestamp - aging.lastTextureReset;

        // Texture progression over time (longer timeline than dirt)
        if (timeSinceTextureReset >= rs.textureLevel2Days * 10) return 10;
        if (timeSinceTextureReset >= rs.textureLevel2Days * 8) return 8;
        if (timeSinceTextureReset >= rs.textureLevel2Days * 6) return 6;
        if (timeSinceTextureReset >= rs.textureLevel2Days * 4) return 4;
        if (timeSinceTextureReset >= rs.textureLevel2Days * 2) return 2;
        if (timeSinceTextureReset >= rs.textureLevel1Days * 2) return 1;

        return 0; // Fresh texture
    }

    function _calculateMaintenanceScore(uint256 tokenId) internal view returns (uint256) {
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        // Maintenance score formula:
        // +2 points per cleaning (shows regular care)
        // +5 points per restoration (shows investment in quality)
        // +10 points per laundering (shows high-value trading)
        // Max score capped at 1000 to prevent overflow
        uint256 score = (aging.cleaningCount * 2) +
                       (aging.restorationCount * 5) +
                       (aging.masterRestorationCount * 10) +
                       (aging.launderingCount * 10);

        return score > 1000 ? 1000 : score;
    }

    function _getFrameLevel(uint256 tokenId) internal view returns (string memory) {
        uint256 score = _calculateMaintenanceScore(tokenId);

        if (score >= 500) return "Diamond";
        if (score >= 200) return "Platinum";
        if (score >= 100) return "Gold";
        if (score >= 50) return "Silver";
        if (score >= 25) return "Bronze";
        return "None";
    }
}
