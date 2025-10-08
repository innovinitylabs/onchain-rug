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
import {LibTransferSecurity} from "../libraries/LibTransferSecurity.sol";
import {OnchainRugsHTMLGenerator} from "../OnchainRugsHTMLGenerator.sol";
import {ICreatorToken} from "@limitbreak/creator-token-contracts/interfaces/ICreatorToken.sol";
import {ICreatorTokenTransferValidator} from "@limitbreak/creator-token-contracts/interfaces/ICreatorTokenTransferValidator.sol";
import {CollectionSecurityPolicy} from "@limitbreak/creator-token-contracts/utils/TransferPolicy.sol";

/**
 * @title RugNFTFacet
 * @notice ERC721-C compatible facet for OnchainRugs NFT functionality
 * @dev Handles minting, token management, ERC721-C compliance with transfer validation
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

        // Initialize aging data with fresh simplified system
        rs.agingData[tokenId] = LibRugStorage.AgingData({
            // Dirt System (3 levels: 0=Clean, 1=Dirty, 2=Very Dirty)
            lastCleaned: block.timestamp, // Start clean at mint
            dirtLevel: 0, // Always 0, calculated dynamically

            // Aging System (11 levels: 0=Clean, 1-10=Aged)
            agingLevel: 0, // Start at pristine level

            // Frame System (5 levels: 0=None, 1=Bronze, 2=Silver, 3=Gold, 4=Diamond)
            frameLevel: 0, // No frame initially
            frameAchievedTime: 0, // No frame achieved yet

            // Maintenance Tracking
            cleaningCount: 0, // Never cleaned initially
            restorationCount: 0, // Never restored initially
            masterRestorationCount: 0, // Never master restored initially
            launderingCount: 0, // Never laundered initially
            lastLaundered: 0, // Never laundered initially

            // Trading History
            lastSalePrice: 0,
            recentSalePrices: [uint256(0), 0, 0]
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

    /**
     * @notice Get frame status for a rug
     * @param tokenId Token ID to check
     * @return frameName Current frame name
     * @return frameAchievedTime When frame was achieved
     */
    function getFrameStatus(uint256 tokenId) external view returns (
        string memory frameName,
        uint256 frameAchievedTime
    ) {
        require(_exists(tokenId), "Token does not exist");
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        return (
            LibRugStorage.getFrameName(aging.frameLevel),
            aging.frameAchievedTime
        );
    }

    /**
     * @notice Get complete maintenance history for a rug
     * @param tokenId Token ID to check
     * @return cleaningCount Number of cleanings
     * @return restorationCount Number of restorations
     * @return masterRestorationCount Number of master restorations
     * @return launderingCount Number of launderings
     * @return maintenanceScore Calculated maintenance score
     * @return lastLaundered Last laundering timestamp
     */
    function getMaintenanceHistory(uint256 tokenId) external view returns (
        uint256 cleaningCount,
        uint256 restorationCount,
        uint256 masterRestorationCount,
        uint256 launderingCount,
        uint256 maintenanceScore,
        uint256 lastLaundered
    ) {
        require(_exists(tokenId), "Token does not exist");
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        return (
            aging.cleaningCount,
            aging.restorationCount,
            aging.masterRestorationCount,
            aging.launderingCount,
            LibRugStorage.calculateMaintenanceScore(aging),
            aging.lastLaundered
        );
    }

    /**
     * @notice Get complete sale history for a rug
     * @param tokenId Token ID to check
     * @return lastSalePrice Most recent sale price
     * @return recentSalePrices Last 3 sale prices
     * @return maxRecentSalePrice Highest of last 3 sales
     */
    function getSaleHistory(uint256 tokenId) external view returns (
        uint256 lastSalePrice,
        uint256[3] memory recentSalePrices,
        uint256 maxRecentSalePrice
    ) {
        require(_exists(tokenId), "Token does not exist");
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        uint256 maxPrice = 0;
        for (uint256 i = 0; i < 3; i++) {
            if (aging.recentSalePrices[i] > maxPrice) {
                maxPrice = aging.recentSalePrices[i];
            }
        }

        return (
            aging.lastSalePrice,
            aging.recentSalePrices,
            maxPrice
        );
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
        LibRugStorage.AgingData memory aging = rs.agingData[tokenId];

        // Get current dirt and aging levels using new system
        uint8 dirtLevel = _getDirtLevel(tokenId);
        uint8 agingLevel = _getAgingLevel(tokenId);

        // Use Scripty system - now mandatory
        require(rs.rugScriptyBuilder != address(0), "ScriptyBuilder not configured");
        require(rs.rugEthFSStorage != address(0), "EthFS storage not configured");
        require(rs.onchainRugsHTMLGenerator != address(0), "HTML generator not configured");

        // Encode rug data for the HTML generator
        // Use abi.encode to match the RugData struct in OnchainRugsHTMLGenerator
        bytes memory encodedRugData = abi.encode(rug);

        string memory frameLevel = LibRugStorage.getFrameName(aging.frameLevel);

        string memory html = OnchainRugsHTMLGenerator(rs.onchainRugsHTMLGenerator).generateProjectHTML(
            encodedRugData,
            tokenId,
            dirtLevel,
            agingLevel, // Changed from textureLevel to agingLevel
            frameLevel,
            rs.rugScriptyBuilder,
            rs.rugEthFSStorage
        );

        // Create JSON metadata (build in chunks to avoid stack depth issues)
        string memory startJson = string(abi.encodePacked(
            '{"name":"OnchainRug #', tokenId.toString(),
            '","description":"OnchainRugs by valipokkann","image":"https://onchainrugs.xyz/logo.png","animation_url":"',
            html,  // HTML generator now returns complete data URI
            '","attributes":['
        ));

        string memory attrs1 = string(abi.encodePacked(
            '{"trait_type":"Text Lines","value":"', rug.textRows.length.toString(),
            '"},{"trait_type":"Character Count","value":"', rug.characterCount.toString(),
            '"},{"trait_type":"Palette Name","value":"', rug.paletteName,
            '"},{"trait_type":"Stripe Count","value":"', rug.stripeCount.toString(),
            '"},{"trait_type":"Complexity","value":"', uint256(rug.complexity).toString(),
            '"},{"trait_type":"Warp Thickness","value":"', uint256(rug.warpThickness).toString()
        ));

        string memory attrs2 = string(abi.encodePacked(
            '"},{"trait_type":"Dirt Level","value":"', uint256(dirtLevel).toString(),
            '"},{"trait_type":"Aging Level","value":"', uint256(agingLevel).toString(),
            '"},{"trait_type":"Cleaning Count","value":"', aging.cleaningCount.toString(),
            '"},{"trait_type":"Restoration Count","value":"', aging.restorationCount.toString()
        ));

        string memory attrs3 = string(abi.encodePacked(
            '"},{"trait_type":"Master Restoration Count","value":"', aging.masterRestorationCount.toString(),
            '"},{"trait_type":"Laundering Count","value":"', aging.launderingCount.toString(),
            '"},{"trait_type":"Maintenance Score","value":"', LibRugStorage.calculateMaintenanceScore(LibRugStorage.rugStorage().agingData[tokenId]).toString(),
            '"},{"trait_type":"Frame Level","value":"', LibRugStorage.getFrameName(aging.frameLevel)
        ));

        string memory attrs4 = string(abi.encodePacked(
            '"},{"trait_type":"Last Sale Price","value":"', aging.lastSalePrice.toString(),
            '"},{"trait_type":"Mint Time","value":"', rug.mintTime.toString(),
            '"},{"trait_type":"Last Cleaned","value":"', aging.lastCleaned.toString(),
            '"}]}'
        ));

        string memory fullJson = string(abi.encodePacked(startJson, attrs1, attrs2, attrs3, attrs4));
        string memory json = Base64.encode(bytes(fullJson));

        return string.concat("data:application/json;base64,", json);
    }

    // ERC721 Metadata overrides
    function name() public pure override(ERC721) returns (string memory) {
        return "OnchainRugs";
    }

    function symbol() public pure override(ERC721) returns (string memory) {
        return "RUGS";
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return interfaceId == type(ICreatorToken).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @dev ERC721-C transfer validation - called during token transfer
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Validate transfer using ERC721-C validator if configured
        // Skip validation for mints (from == address(0)) and burns (to == address(0))
        if (LibTransferSecurity.areTransfersEnforced() && from != address(0) && to != address(0)) {
            address validator = LibTransferSecurity.getTransferValidator();
            if (validator != address(0)) {
                _validateBeforeTransfer(from, to, tokenId, validator);
            }
        }
        
        // Perform the transfer
        address previousOwner = super._update(to, tokenId, auth);
        
        // After transfer validation (optional)
        if (LibTransferSecurity.areTransfersEnforced() && from != address(0) && to != address(0)) {
            address validator = LibTransferSecurity.getTransferValidator();
            if (validator != address(0)) {
                _validateAfterTransfer(from, to, tokenId, validator);
            }
        }
        
        return previousOwner;
    }

    /// @dev Internal transfer validation before transfer
    function _validateBeforeTransfer(address from, address to, uint256 /*tokenId*/, address validator) private view {
        try ICreatorTokenTransferValidator(validator).applyCollectionTransferPolicy(
            msg.sender,
            from,
            to
        ) {} catch {
            revert("Transfer validation failed");
        }
    }

    /// @dev Internal transfer validation after transfer (currently not used as interface doesn't define it)
    function _validateAfterTransfer(address /*from*/, address /*to*/, uint256 /*tokenId*/, address /*validator*/) private pure {
        // After transfer validation is not part of the current interface
        // This is kept for future compatibility
    }

    /// @dev Get the transfer validator (ICreatorToken interface)
    function getTransferValidator() external view returns (address) {
        return LibTransferSecurity.getTransferValidator();
    }

    /// @dev Get the security policy (ICreatorToken interface)
    function getSecurityPolicy() external view returns (string memory) {
        uint256 policyId = LibTransferSecurity.getSecurityPolicyId();
        if (policyId == 0) {
            return "default";
        }
        return string(abi.encodePacked("policy-", Strings.toString(policyId)));
    }

    /// @dev Get whitelisted operators (ICreatorToken interface)
    function getWhitelistedOperators() external view returns (address[] memory) {
        // Return empty array - whitelisting managed by validator
        return new address[](0);
    }

    /// @dev Get permitted contract receivers (ICreatorToken interface)  
    function getPermittedContractReceivers() external view returns (address[] memory) {
        // Return empty array - permissions managed by validator
        return new address[](0);
    }

    /// @dev Check if operator is whitelisted (ICreatorToken interface)
    function isOperatorWhitelisted(address operator) external view returns (bool) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return false;
        
        // Get the collection security policy to find the whitelist ID
        try ICreatorTokenTransferValidator(validator).getCollectionSecurityPolicy(address(this)) returns (
            CollectionSecurityPolicy memory policy
        ) {
            // Check if operator is in the whitelist using the ID
            try ICreatorTokenTransferValidator(validator).isOperatorWhitelisted(
                policy.operatorWhitelistId,
                operator
            ) returns (bool whitelisted) {
                return whitelisted;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }

    /// @dev Check if receiver is whitelisted (ICreatorToken interface)
    function isTransferAllowed(address from, address to) external view returns (bool) {
        if (!LibTransferSecurity.areTransfersEnforced()) return true;
        
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return true;
        
        // Basic check - actual validation happens in transfer hooks
        return true;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    // Internal helper functions for new simplified system

    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Check frame immunity first
        if (LibRugStorage.hasDirtImmunity(aging.frameLevel)) {
            return 0; // Silver+ frames never accumulate dirt
        }

        // Calculate dirt level based on time since cleaning
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        if (timeSinceCleaned >= rs.dirtLevel2Days) return 2;
        if (timeSinceCleaned >= rs.dirtLevel1Days) return 1;
        return 0;
    }

    function _getAgingLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceLevelStart = block.timestamp - aging.lastCleaned;
        uint256 baseInterval = rs.agingAdvanceDays;

        // Apply frame-based aging immunity (higher frames age slower)
        uint256 agingMultiplier = LibRugStorage.getAgingMultiplier(aging.frameLevel);
        uint256 adjustedInterval = (baseInterval * 100) / agingMultiplier;

        // Calculate how many levels we should have advanced
        uint8 levelsAdvanced = uint8(timeSinceLevelStart / adjustedInterval);

        // Cap at max level 10
        uint8 calculatedLevel = aging.agingLevel + levelsAdvanced;
        return calculatedLevel > 10 ? 10 : calculatedLevel;
    }
}
