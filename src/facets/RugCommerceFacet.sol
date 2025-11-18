// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {LibTransferSecurity} from "../libraries/LibTransferSecurity.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @notice Interface for DiamondFramePool contract
 */
interface IDiamondFramePool {
    function claimForTokens(address user, uint256[] calldata tokenIds) external;
    function getClaimableAmountForToken(uint256 tokenId) external view returns (uint256);
    function getPoolBalance() external view returns (uint256);
    function getTotalDiamondFrameNFTs() external view returns (uint256);
}

/**
 * @title RugCommerceFacet
 * @notice Commerce facet for OnchainRugs withdrawals, royalties, and Payment Processor integration
 * @dev Handles ETH withdrawals, EIP-2981 royalty system, and Payment Processor security policies
 */
contract RugCommerceFacet {

    // Events
    event Withdrawn(address indexed to, uint256 amount);
    event RoyaltiesConfigured(uint256 royaltyPercentage, address[] recipients, uint256[] splits);
    event RevenueReceived(uint256 amount, string source);
    event PricingBoundsSet(address indexed tokenAddress, uint256 floorPrice, uint256 ceilingPrice);
    event RoyaltyDistributed(address indexed recipient, uint256 amount);
    event RoyaltyDistributionFailed(address indexed recipient, uint256 amount);
    event PoolContractSet(address indexed poolContract);
    event PoolPercentageSet(uint256 poolPercentage);
    event PoolRoyaltySent(address indexed poolContract, uint256 amount);

    // Royalty storage (separate from main storage for EIP-2981 compliance)
    struct RoyaltyConfig {
        uint256 royaltyPercentage; // Basis points (e.g., 500 = 5%)
        address[] recipients;
        uint256[] recipientSplits; // Basis points for each recipient
        // Pull pattern fallback: pending royalties for failed distributions
        mapping(address => uint256) pendingRoyalties;
        // Diamond frame pool configuration
        address poolContract; // Address of DiamondFramePool contract
        uint256 poolPercentage; // Pool percentage in basis points (e.g., 100 = 1%)
    }

    bytes32 constant ROYALTY_STORAGE_POSITION = keccak256("rug.royalty.storage");

    function royaltyStorage() internal pure returns (RoyaltyConfig storage rs) {
        bytes32 position = ROYALTY_STORAGE_POSITION;
        assembly {
            rs.slot := position
        }
    }

    /**
     * @notice Withdraw ETH from contract (owner only)
     * @param amount Amount to withdraw (0 = withdraw all)
     */
    function withdraw(uint256 amount) external {
        LibDiamond.enforceIsContractOwner();

        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        uint256 withdrawAmount = amount == 0 ? balance : amount;
        require(withdrawAmount <= balance, "Insufficient balance");

        // Use call() for safe ETH transfer
        (bool success,) = payable(msg.sender).call{value: withdrawAmount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, withdrawAmount);
    }

    /**
     * @notice Withdraw to specific address (owner only)
     * @param to Address to withdraw to
     * @param amount Amount to withdraw (0 = withdraw all)
     */
    function withdrawTo(address payable to, uint256 amount) external {
        LibDiamond.enforceIsContractOwner();
        require(to != address(0), "Invalid address");

        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        uint256 withdrawAmount = amount == 0 ? balance : amount;
        require(withdrawAmount <= balance, "Insufficient balance");

        // Use call() for safe ETH transfer
        (bool success,) = to.call{value: withdrawAmount}("");
        require(success, "Transfer failed");

        emit Withdrawn(to, withdrawAmount);
    }

    /**
     * @notice Configure royalty system (owner only)
     * @param royaltyPercentage Royalty percentage in basis points (max 10000 = 100%)
     * @param recipients Array of royalty recipient addresses
     * @param splits Array of royalty splits in basis points (must sum to royaltyPercentage)
     */
    function configureRoyalties(
        uint256 royaltyPercentage,
        address[] calldata recipients,
        uint256[] calldata splits
    ) external {
        LibDiamond.enforceIsContractOwner();

        require(royaltyPercentage <= 10000, "Royalty percentage too high");
        require(recipients.length == splits.length, "Recipients and splits length mismatch");
        require(recipients.length > 0, "Must have at least one recipient");
        require(recipients.length <= 20, "Too many recipients"); // Maximum recipients limit

        // Validate splits sum to royalty percentage using SafeMath
        uint256 totalSplits = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            require(splits[i] > 0, "Split must be greater than 0");
            totalSplits = LibRugStorage.safeAdd(totalSplits, splits[i]);
        }
        require(totalSplits == royaltyPercentage, "Splits must sum to royalty percentage");

        // Validate addresses
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
        }

        RoyaltyConfig storage rs = royaltyStorage();
        rs.royaltyPercentage = royaltyPercentage;
        rs.recipients = recipients;
        rs.recipientSplits = splits;

        emit RoyaltiesConfigured(royaltyPercentage, recipients, splits);
    }

    /**
     * @notice Get royalty info for a token sale (EIP-2981)
     * @param tokenId Token ID
     * @param salePrice Sale price in wei
     * @return receiver Royalty recipient address
     * @return royaltyAmount Royalty amount in wei
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        RoyaltyConfig storage rs = royaltyStorage();

        // If no royalties configured, return zero
        if (rs.recipients.length == 0 || rs.royaltyPercentage == 0) {
            return (address(0), 0);
        }

        // Calculate total royalty amount using SafeMath to prevent overflow
        royaltyAmount = LibRugStorage.safeMul(salePrice, rs.royaltyPercentage) / 10000;

        // For multiple recipients, return the first recipient
        // The full royalty amount will be split among all recipients
        // This follows EIP-2981 which expects a single receiver
        receiver = rs.recipients[0];

        return (receiver, royaltyAmount);
    }

    /**
     * @notice Distribute royalties to all recipients (called after sale)
     * @param tokenId Token ID that was sold
     * @param salePrice Sale price in wei
     * @param saleContract Address of the marketplace contract
     */
    function distributeRoyalties(uint256 tokenId, uint256 salePrice, address saleContract) external {
        // Access control: only marketplace facet or owner
        require(
            msg.sender == address(this) || 
            msg.sender == LibDiamond.contractOwner(),
            "Only marketplace or owner"
        );

        RoyaltyConfig storage rs = royaltyStorage();

        require(rs.recipients.length > 0, "Royalties not configured");
        require(rs.royaltyPercentage > 0, "Royalty percentage not set");
        
        // Maximum recipients limit to prevent gas griefing
        require(rs.recipients.length <= 20, "Too many recipients");

        // Use SafeMath for royalty calculations to prevent overflow
        uint256 totalRoyalty = LibRugStorage.safeMul(salePrice, rs.royaltyPercentage) / 10000;
        require(address(this).balance >= totalRoyalty, "Insufficient contract balance");

        // Calculate pool amount if pool is configured
        uint256 poolAmount = 0;
        uint256 remainingRoyalty = totalRoyalty;
        
        if (rs.poolContract != address(0) && rs.poolPercentage > 0) {
            // Calculate pool amount: (salePrice * poolPercentage) / 10000
            poolAmount = LibRugStorage.safeMul(salePrice, rs.poolPercentage) / 10000;
            
            // Ensure pool amount doesn't exceed total royalty
            if (poolAmount > totalRoyalty) {
                poolAmount = totalRoyalty;
            }
            
            // Send to pool contract
            (bool poolSuccess, ) = rs.poolContract.call{value: poolAmount}("");
            if (poolSuccess) {
                remainingRoyalty = LibRugStorage.safeSub(totalRoyalty, poolAmount);
                emit PoolRoyaltySent(rs.poolContract, poolAmount);
            } else {
                // If pool transfer fails, continue with full royalty to artist
                poolAmount = 0;
                emit RoyaltyDistributionFailed(rs.poolContract, poolAmount);
            }
        }

        // Distribute remaining royalty to artist recipients according to their splits
        // Continue even if individual recipients fail (prevent DoS)
        for (uint256 i = 0; i < rs.recipients.length; i++) {
            // Use SafeMath for recipient royalty calculation
            // Split remaining royalty proportionally based on original splits
            uint256 recipientRoyalty = LibRugStorage.safeMul(remainingRoyalty, rs.recipientSplits[i]) / rs.royaltyPercentage;

            if (recipientRoyalty > 0) {
                // Try to send with gas limit to prevent DoS
                (bool success,) = rs.recipients[i].call{value: recipientRoyalty, gas: 5000}("");
                
                if (success) {
                    emit RoyaltyDistributed(rs.recipients[i], recipientRoyalty);
                } else {
                    // Store failed distribution for pull pattern fallback using SafeMath
                    rs.pendingRoyalties[rs.recipients[i]] = LibRugStorage.safeAdd(
                        rs.pendingRoyalties[rs.recipients[i]], 
                        recipientRoyalty
                    );
                    emit RoyaltyDistributionFailed(rs.recipients[i], recipientRoyalty);
                }
            }
        }
    }
    
    /**
     * @notice Claim pending royalties (pull pattern fallback)
     * @dev Allows recipients to claim royalties that failed during push distribution
     */
    function claimPendingRoyalties() external {
        RoyaltyConfig storage rs = royaltyStorage();
        uint256 amount = rs.pendingRoyalties[msg.sender];
        
        require(amount > 0, "No pending royalties");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        // Transfer first, then clear state (prevents loss if transfer fails)
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Royalty claim failed");
        
        // Only clear state after successful transfer
        rs.pendingRoyalties[msg.sender] = 0;
        
        emit RoyaltyDistributed(msg.sender, amount);
    }
    
    /**
     * @notice Get pending royalties for an address
     * @param recipient Address to check
     * @return amount Pending royalty amount in wei
     */
    function getPendingRoyalties(address recipient) external view returns (uint256) {
        RoyaltyConfig storage rs = royaltyStorage();
        return rs.pendingRoyalties[recipient];
    }

    // View functions

    /**
     * @notice Get contract balance
     * @return balance Contract ETH balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get current royalty configuration
     * @return royaltyPercentage Total royalty percentage in basis points
     * @return recipients Array of recipient addresses
     * @return splits Array of recipient splits in basis points
     */
    function getRoyaltyConfig() external view returns (
        uint256 royaltyPercentage,
        address[] memory recipients,
        uint256[] memory splits
    ) {
        RoyaltyConfig storage rs = royaltyStorage();
        return (rs.royaltyPercentage, rs.recipients, rs.recipientSplits);
    }

    /**
     * @notice Calculate royalty amount for a given sale price
     * @param salePrice Sale price in wei
     * @return royaltyAmount Total royalty amount in wei
     */
    function calculateRoyalty(uint256 salePrice) external view returns (uint256) {
        RoyaltyConfig storage rs = royaltyStorage();
        // Use SafeMath to prevent overflow
        return LibRugStorage.safeMul(salePrice, rs.royaltyPercentage) / 10000;
    }

    /**
     * @notice Get royalty recipients and their shares
     * @return recipients Array of recipient addresses
     * @return shares Array of recipient shares in basis points
     */
    function getRoyaltyRecipients() external view returns (
        address[] memory recipients,
        uint256[] memory shares
    ) {
        RoyaltyConfig storage rs = royaltyStorage();
        return (rs.recipients, rs.recipientSplits);
    }

    /**
     * @notice Check if royalties are configured
     * @return configured True if royalty system is set up
     */
    function areRoyaltiesConfigured() external view returns (bool) {
        RoyaltyConfig storage rs = royaltyStorage();
        return rs.recipients.length > 0 && rs.royaltyPercentage > 0;
    }

    /**
     * @notice Set pool contract address (owner only)
     * @param poolContract Address of the DiamondFramePool contract
     */
    function setPoolContract(address poolContract) external {
        LibDiamond.enforceIsContractOwner();
        require(poolContract != address(0), "Invalid pool contract address");
        
        RoyaltyConfig storage rs = royaltyStorage();
        rs.poolContract = poolContract;
        
        emit PoolContractSet(poolContract);
    }

    /**
     * @notice Set pool percentage (owner only)
     * @param poolPercentage Pool percentage in basis points (e.g., 100 = 1%, max 10000 = 100%)
     */
    function setPoolPercentage(uint256 poolPercentage) external {
        LibDiamond.enforceIsContractOwner();
        require(poolPercentage <= 10000, "Pool percentage too high");
        
        RoyaltyConfig storage rs = royaltyStorage();
        require(rs.royaltyPercentage == 0 || poolPercentage <= rs.royaltyPercentage, "Pool percentage exceeds royalty percentage");
        
        rs.poolPercentage = poolPercentage;
        
        emit PoolPercentageSet(poolPercentage);
    }

    /**
     * @notice Get pool configuration
     * @return poolContract Address of pool contract
     * @return poolPercentage Pool percentage in basis points
     */
    function getPoolConfig() external view returns (address poolContract, uint256 poolPercentage) {
        RoyaltyConfig storage rs = royaltyStorage();
        return (rs.poolContract, rs.poolPercentage);
    }

    /**
     * @notice Claim pool royalties for diamond frame NFTs
     * @dev Diamond contract verifies ownership and frame status, then calls pool contract
     * @param tokenIds Array of token IDs to claim for (must be owned by caller and have diamond frames)
     */
    function claimPoolRoyalties(uint256[] calldata tokenIds) external {
        require(tokenIds.length > 0, "No token IDs provided");
        require(tokenIds.length <= 100, "Too many tokens"); // Prevent DoS
        
        RoyaltyConfig storage rs = royaltyStorage();
        require(rs.poolContract != address(0), "Pool not configured");
        
        // Check for duplicate token IDs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            for (uint256 j = i + 1; j < tokenIds.length; j++) {
                require(tokenIds[i] != tokenIds[j], "Duplicate token ID");
            }
        }
        
        // Verify caller owns all tokens and they have diamond frames (direct storage access - no external calls!)
        uint256[] memory validTokenIds = new uint256[](tokenIds.length);
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Verify ownership using direct storage access (efficient!)
            LibRugStorage.ERC721Storage storage es = LibRugStorage.erc721Storage();
            address owner = es._owners[tokenId];
            require(owner != address(0), "Token does not exist");
            require(owner == msg.sender, "Not owner of token");
            
            // Verify diamond frame using direct storage access
            require(LibRugStorage.hasDiamondFrame(tokenId), "Token does not have diamond frame");
            
            validTokenIds[validCount] = tokenId;
            validCount++;
        }
        
        require(validCount > 0, "No valid diamond frame tokens");
        
        // Resize array to actual valid count
        assembly {
            mstore(validTokenIds, validCount)
        }
        
        // Call pool contract to calculate and pay (pool contract verifies caller is diamond)
        IDiamondFramePool pool = IDiamondFramePool(rs.poolContract);
        pool.claimForTokens(msg.sender, validTokenIds);
    }

    // Payment Processor Integration Functions

    struct PricingBounds {
        bool isEnabled;
        bool isImmutable;
        uint256 floorPrice;
        uint256 ceilingPrice;
    }

    bytes32 constant PRICING_BOUNDS_POSITION = keccak256("rug.pricing.bounds.storage");

    struct PricingBoundsStorage {
        mapping(address => mapping(uint256 => PricingBounds)) tokenBounds;  // token => tokenId => bounds
        mapping(address => PricingBounds) collectionBounds;                  // token => bounds
        address approvedPaymentCoin;                                         // Approved ERC20 for price constraints
    }

    function pricingBoundsStorage() internal pure returns (PricingBoundsStorage storage pbs) {
        bytes32 position = PRICING_BOUNDS_POSITION;
        assembly {
            pbs.slot := position
        }
    }

    /**
     * @notice Set collection-level pricing bounds for Payment Processor
     * @param floorPrice Minimum price in wei
     * @param ceilingPrice Maximum price in wei
     * @param immutable_ Whether bounds are immutable
     */
    function setCollectionPricingBounds(
        uint256 floorPrice,
        uint256 ceilingPrice,
        bool immutable_
    ) external {
        LibDiamond.enforceIsContractOwner();
        require(ceilingPrice >= floorPrice, "Ceiling must be >= floor");
        
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        PricingBounds storage bounds = pbs.collectionBounds[address(this)];
        
        require(!bounds.isImmutable, "Bounds are immutable");
        
        bounds.isEnabled = true;
        bounds.isImmutable = immutable_;
        bounds.floorPrice = floorPrice;
        bounds.ceilingPrice = ceilingPrice;

        emit PricingBoundsSet(address(this), floorPrice, ceilingPrice);
    }

    /**
     * @notice Set token-level pricing bounds for Payment Processor
     * @param tokenId Token ID to set bounds for
     * @param floorPrice Minimum price in wei
     * @param ceilingPrice Maximum price in wei
     * @param immutable_ Whether bounds are immutable
     */
    function setTokenPricingBounds(
        uint256 tokenId,
        uint256 floorPrice,
        uint256 ceilingPrice,
        bool immutable_
    ) external {
        LibDiamond.enforceIsContractOwner();
        require(ceilingPrice >= floorPrice, "Ceiling must be >= floor");
        
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        PricingBounds storage bounds = pbs.tokenBounds[address(this)][tokenId];
        
        require(!bounds.isImmutable, "Bounds are immutable");
        
        bounds.isEnabled = true;
        bounds.isImmutable = immutable_;
        bounds.floorPrice = floorPrice;
        bounds.ceilingPrice = ceilingPrice;

        emit PricingBoundsSet(address(this), floorPrice, ceilingPrice);
    }

    /**
     * @notice Set approved payment coin for price-constrained sales
     * @param coin ERC20 token address (address(0) for ETH)
     */
    function setApprovedPaymentCoin(address coin) external {
        LibDiamond.enforceIsContractOwner();
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        pbs.approvedPaymentCoin = coin;
    }

    /**
     * @notice Get collection pricing bounds
     * @return floorPrice Minimum price
     * @return ceilingPrice Maximum price
     */
    function getCollectionPricingBounds() external view returns (uint256 floorPrice, uint256 ceilingPrice) {
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        PricingBounds storage bounds = pbs.collectionBounds[address(this)];
        return (bounds.floorPrice, bounds.ceilingPrice);
    }

    /**
     * @notice Get token pricing bounds
     * @param tokenId Token ID
     * @return floorPrice Minimum price
     * @return ceilingPrice Maximum price
     */
    function getTokenPricingBounds(uint256 tokenId) external view returns (uint256 floorPrice, uint256 ceilingPrice) {
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        PricingBounds storage bounds = pbs.tokenBounds[address(this)][tokenId];
        
        // If token-level bounds not set, fall back to collection bounds
        if (!bounds.isEnabled) {
            PricingBounds storage collectionBounds = pbs.collectionBounds[address(this)];
            return (collectionBounds.floorPrice, collectionBounds.ceilingPrice);
        }
        
        return (bounds.floorPrice, bounds.ceilingPrice);
    }

    /**
     * @notice Check if collection pricing is immutable
     * @return immutable_ True if immutable
     */
    function isCollectionPricingImmutable() external view returns (bool) {
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        return pbs.collectionBounds[address(this)].isImmutable;
    }

    /**
     * @notice Check if token pricing is immutable
     * @param tokenId Token ID
     * @return immutable_ True if immutable
     */
    function isTokenPricingImmutable(uint256 tokenId) external view returns (bool) {
        PricingBoundsStorage storage pbs = pricingBoundsStorage();
        return pbs.tokenBounds[address(this)][tokenId].isImmutable;
    }

    /**
     * @notice Get approved payment coin
     * @return coin Approved payment coin address
     */
    function getApprovedPaymentCoin() external view returns (address) {
        return pricingBoundsStorage().approvedPaymentCoin;
    }

    // Note: supportsInterface removed to avoid conflict with ERC721's supportsInterface

    /**
     * @notice Get complete sale history for a rug (moved from RugNFTFacet)
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
        // Check token exists using diamond call
        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodeWithSignature("ownerOf(uint256)", tokenId)
        );
        require(success && data.length == 32, "Token does not exist");
        address owner = abi.decode(data, (address));
        require(owner != address(0), "Token does not exist");
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

    // Note: receive() and fallback() functions removed as Diamond handles ETH reception
}
