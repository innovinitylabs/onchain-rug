// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
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
contract RugNFTFacet is ICreatorToken {
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

    // ERC721 Events (matching IERC721)
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    // Marketplace event (emitted when listing is auto-cancelled on transfer)
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);


    constructor() {
        // Initialize ERC721-C transfer security with deterministic validator
        LibTransferSecurity.initializeTransferSecurity(DEFAULT_TRANSFER_VALIDATOR);

        // Initialize ERC721 storage
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        es.name = "OnchainRugs";
        es.symbol = "RUGS";
    }

    /**
     * @notice Initialize ERC721 metadata (for diamond pattern)
     * @dev This function should be called after the facet is added to the diamond
     */
    function initializeERC721Metadata() external {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        if (bytes(es.name).length == 0) {
            es.name = "OnchainRugs";
        }
        if (bytes(es.symbol).length == 0) {
            es.symbol = "RUGS";
        }
    }

    /**
     * @notice Mint a new rug NFT (ERC721-C compatible)
     * @param textRows Array of text lines (1-5)
     * @param seed Random seed for generation (0 = auto-generate)
     * @param visual Visual configuration parameters
     * @param art Art generation data
     * @param characterCount Total characters (can be derived from filteredCharacterMap)
     *
     * @dev TEST DATA REFERENCE: See TEST_MINT_REFERENCE.md and test_mint_data.json
     *      Always use the official test data, never random/placeholder values!
     */
    function mintRug(
        string[] calldata textRows,
        uint256 seed,
        VisualConfig calldata visual,
        ArtData calldata art,
        uint256 characterCount
    ) external payable {
        this.mintRugFor{value: msg.value}(msg.sender, textRows, seed, visual, art, characterCount);
    }

    function mintRugFor(
        address recipient,
        string[] calldata textRows,
        uint256 seed,
        VisualConfig calldata visual,
        ArtData calldata art,
        uint256 characterCount
    ) external payable {
        require(recipient != address(0), "Invalid recipient");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Basic validation
        require(textRows.length > 0 && textRows.length <= 5, "Invalid text length");
        
        // Validate each text row length to prevent gas griefing
        for (uint256 i = 0; i < textRows.length; i++) {
            require(bytes(textRows[i]).length <= 100, "Text row too long");
        }
        
        require(visual.warpThickness >= 1 && visual.warpThickness <= 5, "Invalid warp thickness");
        require(LibRugStorage.canMintSupply(), "Max supply reached");
        require(LibRugStorage.canMint(recipient), "Wallet limit exceeded");

        // Text uniqueness check
        require(LibRugStorage.isTextAvailable(textRows), "Text already used");

        // Pricing validation
        uint256 price = LibRugStorage.calculateMintPrice(textRows.length);
        require(msg.value >= price, "Insufficient payment");

        // Seed must be provided by frontend (no auto-generation)

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
            curator: recipient,
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
        LibRugStorage.recordMint(recipient);

        // Mint NFT -  use _mint instead of _safeMint to avoid ERC721c receiver checks. since this is open to all mint, owner checks aren't necessary.
        _mint(recipient, tokenId);

        emit RugMinted(tokenId, recipient, textRows, seed);
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
    function tokenURI(uint256 tokenId) public view returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData memory rug = rs.rugs[tokenId];
        LibRugStorage.AgingData memory aging = rs.agingData[tokenId];

        // Get current dirt level
        uint8 dirtLevel = _getDirtLevel(tokenId);

        // Use Scripty system - now mandatory
        require(rs.rugScriptyBuilder != address(0), "ScriptyBuilder not configured");
        require(rs.rugEthFSStorage != address(0), "EthFS storage not configured");
        require(rs.onchainRugsHTMLGenerator != address(0), "HTML generator not configured");

        // Encode rug data for the HTML generator
        bytes memory encodedRugData = abi.encode(rug);

        string memory frameLevel = LibRugStorage.getFrameName(aging.frameLevel);

        string memory html = OnchainRugsHTMLGenerator(rs.onchainRugsHTMLGenerator).generateProjectHTML(
            encodedRugData,
            tokenId,
            dirtLevel,
            _getAgingLevel(tokenId), // Use aging level as texture level
            frameLevel,
            rs.rugScriptyBuilder,
            rs.rugEthFSStorage
        );

        // Create JSON metadata (split into parts to avoid stack too deep)
        string memory startJson = string(abi.encodePacked(
            '{"name":"OnchainRug #', tokenId.toString(),
            '","description":"OnchainRugs by valipokkann","image":"https://onchainrugs.xyz/logo.png","animation_url":"',
            html,
            '","attributes":['
        ));

        string memory attrs1 = string(abi.encodePacked(
            '{"trait_type":"Text Lines","value":"', rug.textRows.length.toString(),
            '"},{"trait_type":"Character Count","value":"', rug.characterCount.toString(),
            '"},{"trait_type":"Palette Name","value":"', rug.paletteName,
            '"},{"trait_type":"Stripe Count","value":"', rug.stripeCount.toString(),
            '"},{"trait_type":"Curator","value":"', Strings.toHexString(uint256(uint160(rug.curator)), 20),
            '"},{"trait_type":"Warp Thickness","value":"', uint256(rug.warpThickness).toString()
        ));

        string memory attrs2 = string(abi.encodePacked(
            '"},{"trait_type":"Dirt Level","value":"', uint256(dirtLevel).toString(),
            '"},{"trait_type":"Aging Level","value":"', uint256(_getAgingLevel(tokenId)).toString(),
            '"},{"trait_type":"Cleaning Count","value":"', aging.cleaningCount.toString(),
            '"},{"trait_type":"Restoration Count","value":"', aging.restorationCount.toString()
        ));

        string memory attrs3 = string(abi.encodePacked(
            '"},{"trait_type":"Master Restoration Count","value":"', aging.masterRestorationCount.toString(),
            '"},{"trait_type":"Laundering Count","value":"', aging.launderingCount.toString(),
            '"},{"trait_type":"Maintenance Score","value":"', LibRugStorage.calculateMaintenanceScore(LibRugStorage.rugStorage().agingData[tokenId]).toString(),
            '"},{"trait_type":"Frame","value":"', LibRugStorage.getFrameName(aging.frameLevel)
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



    // ===== ERC721 CORE FUNCTIONS =====

    function ownerOf(uint256 tokenId) public view returns (address) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        address owner = es._owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    function balanceOf(address owner) public view returns (uint256) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return es._balances[owner];
    }

    function approve(address to, uint256 tokenId) public {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        address owner = es._owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        require(msg.sender == owner || es._operatorApprovals[owner][msg.sender], "ERC721: approve caller is not token owner or approved for all");

        es._tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(es._owners[tokenId] != address(0), "ERC721: invalid token ID");
        return es._tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(operator != msg.sender, "ERC721: approve to caller");
        es._operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        return es._operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }

    // ERC721 Metadata
    function name() public view returns (string memory) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        return es.name;
    }

    function symbol() public view returns (string memory) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        return es.symbol;
    }

    function totalSupply() public view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return rs.totalSupply;
    }

    // ERC721 enumerable functions
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(index < es._balances[owner], "ERC721Enumerable: owner index out of bounds");
        return es._ownedTokens[owner][index];
    }

    function tokenByIndex(uint256 index) public view returns (uint256) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(index < es._allTokens.length, "ERC721Enumerable: global index out of bounds");
        return es._allTokens[index];
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        return es._owners[tokenId] != address(0);
    }

    // Internal ERC721 functions
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        address owner = es._owners[tokenId];
        return (spender == owner || es._tokenApprovals[tokenId] == spender || es._operatorApprovals[owner][spender]);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(es._owners[tokenId] == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approval
        delete es._tokenApprovals[tokenId];

        es._balances[from] -= 1;
        es._balances[to] += 1;
        es._owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length == 0) {
            return true;
        }

        bytes memory encodedCall = abi.encodeWithSelector(
            IERC721Receiver(to).onERC721Received.selector,
            msg.sender,
            from,
            tokenId,
            data
        );

        (bool success, bytes memory returnData) = to.call(encodedCall);
        if (success) {
            return abi.decode(returnData, (bytes4)) == IERC721Receiver.onERC721Received.selector;
        } else {
            if (returnData.length > 0) {
                assembly {
                    let returnDataSize := mload(returnData)
                    revert(add(32, returnData), returnDataSize)
                }
            } else {
                revert("ERC721: transfer to non ERC721Receiver implementer");
            }
        }
    }

    function _mint(address to, uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        require(to != address(0), "ERC721: mint to the zero address");
        require(es._owners[tokenId] == address(0), "ERC721: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId);

        es._balances[to] += 1;
        es._owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function _burn(uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        address owner = es._owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approval
        delete es._tokenApprovals[tokenId];

        es._balances[owner] -= 1;
        delete es._owners[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    // ERC721 enumerable helper functions
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        uint256 length = es._balances[to];
        es._ownedTokens[to][length] = tokenId;
        es._ownedTokensIndex[tokenId] = length;
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();

        uint256 lastTokenIndex = es._balances[from] - 1;
        uint256 tokenIndex = es._ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = es._ownedTokens[from][lastTokenIndex];
            es._ownedTokens[from][tokenIndex] = lastTokenId;
            es._ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        delete es._ownedTokensIndex[tokenId];
        delete es._ownedTokens[from][lastTokenIndex];
    }

    function _addTokenToAllTokensEnumeration(uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
        es._allTokensIndex[tokenId] = es._allTokens.length;
        es._allTokens.push(tokenId);
    }

    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) internal {
        LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();

        uint256 lastTokenIndex = es._allTokens.length - 1;
        uint256 tokenIndex = es._allTokensIndex[tokenId];
        uint256 lastTokenId = es._allTokens[lastTokenIndex];

        es._allTokens[tokenIndex] = lastTokenId;
        es._allTokensIndex[lastTokenId] = tokenIndex;

        delete es._allTokensIndex[tokenId];
        es._allTokens.pop();
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

    /// @dev ERC721-C transfer validation hook
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
        // Handle enumerable data structures
        if (from == address(0)) {
            // Mint: token added to 'to' enumeration
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            // Transfer: remove from 'from' enumeration
            _removeTokenFromOwnerEnumeration(from, tokenId);
            
            // Auto-cancel marketplace listing when NFT is transferred away from seller
            // Only for actual transfers (not mints or burns)
            if (to != address(0)) {
                bool cancelled = LibRugStorage.cancelListingOnTransfer(tokenId, from);
                if (cancelled) {
                    // Emit event to match marketplace facet's ListingCancelled event
                    emit ListingCancelled(tokenId, from);
                }
            }
        }

        if (to == address(0)) {
            // Burn: token removed from 'from' enumeration (already done above)
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            // Transfer or Mint: add to 'to' enumeration
            _addTokenToOwnerEnumeration(to, tokenId);
        }

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
    }

    /// @dev ERC721 supportsInterface
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(IERC721).interfaceId ||
               interfaceId == type(IERC721Metadata).interfaceId ||
               interfaceId == type(ICreatorToken).interfaceId ||
               interfaceId == 0x01ffc9a7; // ERC165
    }


}
