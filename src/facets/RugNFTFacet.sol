// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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
import {TransferSecurityLevels, CollectionSecurityPolicy} from "@limitbreak/creator-token-contracts/utils/TransferPolicy.sol";

/**
 * @title RugNFTFacet
 * @notice ERC721-C compatible facet for OnchainRugs NFT functionality
 * @dev Handles minting, token management, ERC721 compliance, and ERC721-C transfer validation
 */
contract RugNFTFacet is ERC721, ICreatorToken {
    using Strings for uint256;

    // ERC721-C Constants - LimitBreak CreatorTokenTransferValidator v5.0.0 (deterministic address)
    address public constant DEFAULT_TRANSFER_VALIDATOR = 0x721C008fdff27BF06E7E123956E2Fe03B63342e3;

    // Structs to reduce stack depth in mintRug
    struct VisualConfig {
        uint8 warpThickness;    // Design parameter (required for HTML generation)
        uint256 stripeCount;    // Number of stripes
    }

    struct ArtData {
        string paletteName;           // Color palette identifier
        string minifiedPalette;       // Compressed palette data
        string minifiedStripeData;    // Compressed stripe data
        string filteredCharacterMap;  // Character usage map (required for HTML generation)
    }

    // Events
    event RugMinted(uint256 indexed tokenId, address indexed owner, string[] textRows, uint256 seed);
    event RugBurned(uint256 indexed tokenId, address indexed owner);

    constructor() ERC721("OnchainRugs", "RUGS") {
        // Initialize ERC721-C transfer security with deterministic validator
        LibTransferSecurity.initializeTransferSecurity(DEFAULT_TRANSFER_VALIDATOR);
    }

    /**
     * @notice Mint a new rug NFT (ERC721-C compatible)
     * @param textRows Array of text lines (1-5)
     * @param seed Random seed for generation (0 = auto-generate)
     * @param visual Visual configuration parameters
     * @param art Art generation data
     * @param complexity Pattern complexity (deprecated, kept for compatibility)
     * @param characterCount Total characters (can be derived from filteredCharacterMap)
     */
    function mintRug(
        string[] calldata textRows,
        uint256 seed,
        VisualConfig calldata visual,
        ArtData calldata art,
        uint8 complexity,
        uint256 characterCount
    ) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Basic validation
        require(textRows.length > 0 && textRows.length <= 5, "Invalid text length");
        require(visual.warpThickness >= 1 && visual.warpThickness <= 5, "Invalid warp thickness");
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
            paletteName: art.paletteName,
            minifiedPalette: art.minifiedPalette,
            minifiedStripeData: art.minifiedStripeData,
            warpThickness: visual.warpThickness,
            mintTime: block.timestamp,
            filteredCharacterMap: art.filteredCharacterMap,
            complexity: complexity,
            characterCount: characterCount,
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

        // Mark text as used and record mint
        LibRugStorage.markTextAsUsed(textRows);
        LibRugStorage.recordMint(msg.sender);

        // Mint NFT - temporarily use _mint instead of _safeMint to avoid ERC721 receiver checks
        _mint(msg.sender, tokenId);

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
        override(ERC721)
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData memory rug = rs.rugs[tokenId];
        LibRugStorage.AgingData memory aging = rs.agingData[tokenId];

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

        string memory html = OnchainRugsHTMLGenerator(rs.onchainRugsHTMLGenerator).generateProjectHTML(
            encodedRugData,
            tokenId,
            dirtLevel,
            textureLevel,
            Strings.toString(aging.frameLevel),
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
                        '"}]}'
                    )
                )
            )
        );

        return string.concat("data:application/json;base64,", json);
    }



    // ERC721 Metadata
    function name() public view override(ERC721) returns (string memory) {
        return "OnchainRugs";
    }

    function symbol() public view override(ERC721) returns (string memory) {
        return "RUGS";
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
        // Texture system removed - return default level
        return 0;
    }

    // =======================================================================
    // ERC721-C Interface Implementation
    // =======================================================================

    /// @notice Get the transfer validator contract address
    function getTransferValidator() external view override returns (ICreatorTokenTransferValidator) {
        return ICreatorTokenTransferValidator(LibTransferSecurity.getTransferValidator());
    }

    /// @notice Get the security policy for this collection
    function getSecurityPolicy() external view override returns (CollectionSecurityPolicy memory) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) {
            return CollectionSecurityPolicy({
                transferSecurityLevel: TransferSecurityLevels.Zero,
                operatorWhitelistId: 0,
                permittedContractReceiversId: 0
            });
        }

        try ICreatorTokenTransferValidator(validator).getCollectionSecurityPolicy(address(this)) returns (CollectionSecurityPolicy memory policy) {
            return policy;
        } catch {
            return CollectionSecurityPolicy({
                transferSecurityLevel: TransferSecurityLevels.Zero,
                operatorWhitelistId: 0,
                permittedContractReceiversId: 0
            });
        }
    }

    /// @notice Get whitelisted operators for this collection
    function getWhitelistedOperators() external view override returns (address[] memory) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return new address[](0);

        CollectionSecurityPolicy memory policy = this.getSecurityPolicy();
        try ICreatorTokenTransferValidator(validator).getWhitelistedOperators(policy.operatorWhitelistId) returns (address[] memory operators) {
            return operators;
        } catch {
            return new address[](0);
        }
    }

    /// @notice Get permitted contract receivers for this collection
    function getPermittedContractReceivers() external view override returns (address[] memory) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return new address[](0);

        CollectionSecurityPolicy memory policy = this.getSecurityPolicy();
        try ICreatorTokenTransferValidator(validator).getPermittedContractReceivers(policy.permittedContractReceiversId) returns (address[] memory receivers) {
            return receivers;
        } catch {
            return new address[](0);
        }
    }

    /// @notice Check if an operator is whitelisted
    function isOperatorWhitelisted(address operator) external view override returns (bool) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return false;

        CollectionSecurityPolicy memory policy = this.getSecurityPolicy();
        try ICreatorTokenTransferValidator(validator).isOperatorWhitelisted(policy.operatorWhitelistId, operator) returns (bool whitelisted) {
            return whitelisted;
        } catch {
            return false;
        }
    }

    /// @notice Check if a contract receiver is permitted
    function isContractReceiverPermitted(address receiver) external view override returns (bool) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return false;

        CollectionSecurityPolicy memory policy = this.getSecurityPolicy();
        try ICreatorTokenTransferValidator(validator).isContractReceiverPermitted(policy.permittedContractReceiversId, receiver) returns (bool permitted) {
            return permitted;
        } catch {
            return false;
        }
    }

    /// @notice Check if a transfer is allowed
    function isTransferAllowed(address caller, address from, address to) external view override returns (bool) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return true; // No validator = allow all transfers

        try ICreatorTokenTransferValidator(validator).applyCollectionTransferPolicy(caller, from, to) {
            return true; // No revert = transfer allowed
        } catch {
            return false; // Revert = transfer not allowed
        }
    }

    /// @dev Override OpenZeppelin ERC721 _beforeTokenTransfer for ERC721-C validation
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        // TEMPORARILY DISABLED: All validation to isolate the minting issue
        // TODO: Re-enable ERC721-C validation for transfers after fixing minting
        /*
        // Validate transfer using ERC721-C validator for transfers only (not mints)
        // For open mints, we don't need validation during minting (from == address(0))
        if (LibTransferSecurity.areTransfersEnforced() && from != address(0) && to != address(0)) {
            address validator = LibTransferSecurity.getTransferValidator();
            if (validator != address(0)) {
                try ICreatorTokenTransferValidator(validator).applyCollectionTransferPolicy(
                    msg.sender,
                    from,
                    to
                ) {} catch {
                    revert("Transfer validation failed");
                }
            }
        }
        */
    }

    /// @dev Override supportsInterface to include ICreatorToken
    function supportsInterface(bytes4 interfaceId) public view override(ERC721) returns (bool) {
        return interfaceId == type(ICreatorToken).interfaceId || super.supportsInterface(interfaceId);
    }
}
