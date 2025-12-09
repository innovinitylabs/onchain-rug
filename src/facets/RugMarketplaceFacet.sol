// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "solady/utils/ReentrancyGuard.sol";
import {RugLaunderingFacet} from "./RugLaunderingFacet.sol";
import {RugCommerceFacet} from "./RugCommerceFacet.sol";

/**
 * @title RugMarketplaceFacet
 * @notice Simple marketplace for OnchainRugs with basic listing and buying functionality
 * @dev Integrates with laundering system to track sales and trigger automatic cleaning
 */
contract RugMarketplaceFacet is ReentrancyGuard {

    // ===== STATE =====

    // ===== EVENTS =====

    event ListingCreated(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 expiresAt);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event ListingPriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);
    event ListingSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event RoyaltyDistributionSkipped(uint256 indexed tokenId, uint256 salePrice);
    event RefundFailed(address indexed recipient, uint256 amount);
    
    // Offer events
    event OfferCreated(uint256 indexed offerId, uint256 indexed tokenId, address indexed offerer, uint256 price, uint256 expiresAt);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed tokenId, address indexed offerer, address owner, uint256 price);
    event OfferCancelled(uint256 indexed offerId, uint256 indexed tokenId, address indexed offerer);
    
    // ===== ERRORS =====

    error NotTokenOwner();
    error NotListed();
    error ListingExpired();
    error InsufficientPayment();
    error ListingAlreadyExists();
    error InvalidPrice();
    error TransferFailed();
    error NotApprovedForTransfer();
    error CannotBuyOwnListing();
    error SellerNoLongerOwner();
    error OfferNotFound();
    error OfferExpired();
    error OfferNotActive();
    error CannotOfferOwnToken();
    error NotOfferOwner();

    // ===== MODIFIERS =====
    
    modifier onlyTokenOwner(uint256 tokenId) {
        if (IERC721(address(this)).ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _;
    }
    
    // ===== DIRECT LISTING FUNCTIONS =====
    
    /**
     * @notice Create a fixed-price listing
     * @param tokenId Token ID to list
     * @param price Listing price in wei
     * @param duration Listing duration in seconds (0 = no expiration)
     */
    function createListing(uint256 tokenId, uint256 price, uint256 duration)
        external
        onlyTokenOwner(tokenId)
    {
        if (price == 0) revert InvalidPrice();
        
        // Prevent overflow in fee calculations
        require(price <= type(uint256).max / 2, "Price too large");

        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Listing storage listing = ms.listings[tokenId];

        // Check no active listing
        if (listing.isActive) revert ListingAlreadyExists();

        // Verify the marketplace is approved to transfer this NFT
        address approved = IERC721(address(this)).getApproved(tokenId);
        bool approvedForAll = IERC721(address(this)).isApprovedForAll(msg.sender, address(this));
        if (approved != address(this) && !approvedForAll) {
            revert NotApprovedForTransfer();
        }

        uint256 expiresAt = duration == 0 ? 0 : block.timestamp + duration;

        listing.seller = msg.sender;
        listing.price = price;
        listing.expiresAt = expiresAt;
        listing.isActive = true;

        emit ListingCreated(tokenId, msg.sender, price, expiresAt);
    }
    
    /**
     * @notice Cancel an active listing
     * @param tokenId Token ID to cancel listing for
     */
    function cancelListing(uint256 tokenId) external {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Listing storage listing = ms.listings[tokenId];
        
        if (!listing.isActive) revert NotListed();
        if (listing.seller != msg.sender) revert NotTokenOwner();
        
        listing.isActive = false;
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @notice Update listing price
     * @param tokenId Token ID
     * @param newPrice New price in wei
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) external {
        if (newPrice == 0) revert InvalidPrice();
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Listing storage listing = ms.listings[tokenId];
        
        if (!listing.isActive) revert NotListed();
        if (listing.seller != msg.sender) revert NotTokenOwner();
        
        uint256 oldPrice = listing.price;
        
        // Maximum price change limit: prevent manipulation
        // New price must be between 0.5x and 2x the old price
        // Use multiplication instead of division to avoid precision loss
        require(newPrice >= LibRugStorage.safeMul(oldPrice, 50) / 100, "Price decrease too large");
        require(newPrice <= LibRugStorage.safeMul(oldPrice, 2), "Price increase too large");
        
        listing.price = newPrice;
        
        emit ListingPriceUpdated(tokenId, oldPrice, newPrice);
    }
    
    /**
     * @notice Buy a listed NFT
     * @param tokenId Token ID to purchase
     */
    function buyListing(uint256 tokenId) external payable nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Listing storage listing = ms.listings[tokenId];
        
        if (!listing.isActive) revert NotListed();
        if (listing.expiresAt != 0 && block.timestamp > listing.expiresAt) revert ListingExpired();
        if (msg.value < listing.price) revert InsufficientPayment();
        if (msg.sender == listing.seller) revert CannotBuyOwnListing();
        
        address seller = listing.seller;
        uint256 price = listing.price;

        // CRITICAL: Verify seller still owns the NFT BEFORE processing payment
        // This prevents the attack where seller lists NFT then transfers it away
        address currentOwner = IERC721(address(this)).ownerOf(tokenId);
        if (currentOwner != seller) revert SellerNoLongerOwner();

        // Re-check approval before transfer (prevent race condition)
        address approved = IERC721(address(this)).getApproved(tokenId);
        bool approvedForAll = IERC721(address(this)).isApprovedForAll(seller, address(this));
        if (approved != address(this) && !approvedForAll) {
            revert NotApprovedForTransfer();
        }

        // Deactivate listing AFTER ownership verification
        listing.isActive = false;

        // Transfer NFT from seller to buyer FIRST to prevent reentrancy
        IERC721(address(this)).transferFrom(seller, msg.sender, tokenId);

        // Process payment with fees and royalties AFTER transfer is complete
        _processPayment(tokenId, seller, price);
        

        // Record sale for laundering tracking (tracks last 3 sale prices)
        RugLaunderingFacet launderingFacet = RugLaunderingFacet(address(this));
        launderingFacet.recordSale(tokenId, seller, msg.sender, price);

        // Update marketplace stats with SafeMath
        ms.totalSales++;
        ms.totalVolume = LibRugStorage.safeAdd(ms.totalVolume, price);
        
        // Refund excess payment - don't revert if refund fails
        if (msg.value > price) {
            uint256 refundAmount = msg.value - price;
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            if (!success) {
                // Don't revert - just emit event
                // Refund stays in contract, can be claimed later
                emit RefundFailed(msg.sender, refundAmount);
            }
        }
        
        emit ListingSold(tokenId, seller, msg.sender, price);
    }

    // ===== OFFER FUNCTIONS =====

    /**
     * @notice Create an offer for an NFT
     * @param tokenId Token ID to make an offer for
     * @param duration Offer duration in seconds (0 = no expiration)
     */
    function makeOffer(uint256 tokenId, uint256 duration) external payable nonReentrant {
        if (msg.value == 0) revert InvalidPrice();
        
        // Prevent overflow in fee calculations
        require(msg.value <= type(uint256).max / 2, "Price too large");

        // Cannot make offer on own token
        address owner = IERC721(address(this)).ownerOf(tokenId);
        if (msg.sender == owner) revert CannotOfferOwnToken();

        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        
        // Get next offer ID and increment
        uint256 offerId = ms.nextOfferId;
        ms.nextOfferId++;

        uint256 expiresAt = duration == 0 ? 0 : block.timestamp + duration;

        LibRugStorage.Offer storage offer = ms.offers[offerId];
        offer.offerId = offerId;
        offer.offerer = msg.sender;
        offer.tokenId = tokenId;
        offer.price = msg.value;
        offer.expiresAt = expiresAt;
        offer.isActive = true;

        // Add to token's offer list
        ms.tokenOffers[tokenId].push(offerId);

        emit OfferCreated(offerId, tokenId, msg.sender, msg.value, expiresAt);
    }

    /**
     * @notice Accept an offer for an NFT
     * @param offerId Offer ID to accept
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Offer storage offer = ms.offers[offerId];
        
        if (!offer.isActive) revert OfferNotActive();
        if (offer.expiresAt != 0 && block.timestamp > offer.expiresAt) revert OfferExpired();
        
        uint256 tokenId = offer.tokenId;
        address owner = IERC721(address(this)).ownerOf(tokenId);
        
        // Only token owner can accept offers
        if (msg.sender != owner) revert NotTokenOwner();
        
        // Cannot accept own offer (shouldn't happen, but check anyway)
        if (offer.offerer == owner) revert CannotOfferOwnToken();

        address offerer = offer.offerer;
        uint256 price = offer.price;

        // Deactivate offer
        offer.isActive = false;

        // Verify the marketplace is approved to transfer this NFT
        address approved = IERC721(address(this)).getApproved(tokenId);
        bool approvedForAll = IERC721(address(this)).isApprovedForAll(owner, address(this));
        if (approved != address(this) && !approvedForAll) {
            revert NotApprovedForTransfer();
        }

        // Transfer NFT from owner to offerer FIRST to prevent reentrancy
        IERC721(address(this)).transferFrom(owner, offerer, tokenId);

        // Process payment with fees and royalties AFTER transfer is complete
        _processPayment(tokenId, owner, price);

        // Record sale for laundering tracking
        RugLaunderingFacet launderingFacet = RugLaunderingFacet(address(this));
        launderingFacet.recordSale(tokenId, owner, offerer, price);

        // Update marketplace stats
        ms.totalSales++;
        ms.totalVolume = LibRugStorage.safeAdd(ms.totalVolume, price);

        // Cancel any active listing for this token
        LibRugStorage.Listing storage listing = ms.listings[tokenId];
        if (listing.isActive) {
            listing.isActive = false;
            emit ListingCancelled(tokenId, owner);
        }

        emit OfferAccepted(offerId, tokenId, offerer, owner, price);
    }

    /**
     * @notice Cancel an offer
     * @param offerId Offer ID to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Offer storage offer = ms.offers[offerId];
        
        if (!offer.isActive) revert OfferNotActive();
        if (offer.offerer != msg.sender) revert NotOfferOwner();
        
        uint256 tokenId = offer.tokenId;
        uint256 refundAmount = offer.price;
        
        // Deactivate offer
        offer.isActive = false;
        
        // Refund the offerer
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();
        
        emit OfferCancelled(offerId, tokenId, msg.sender);
    }

    // ===== VIEW FUNCTIONS =====

    /**
     * @notice Get listing details
     */
    function getListing(uint256 tokenId) external view returns (
        address seller,
        uint256 price,
        uint256 expiresAt,
        bool isActive
    ) {
        LibRugStorage.Listing storage listing = LibRugStorage.marketplaceStorage().listings[tokenId];
        return (listing.seller, listing.price, listing.expiresAt, listing.isActive);
    }

    /**
     * @notice Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 totalFeesCollected,
        uint256 totalVolume,
        uint256 totalSales,
        uint256 marketplaceFeeBPS
    ) {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        return (
            ms.totalFeesCollected,
            ms.totalVolume,
            ms.totalSales,
            ms.marketplaceFeePercent
        );
    }

    /**
     * @notice Get offer details
     * @param offerId Offer ID
     */
    function getOffer(uint256 offerId) external view returns (
        uint256 offerIdOut,
        address offerer,
        uint256 tokenId,
        uint256 price,
        uint256 expiresAt,
        bool isActive
    ) {
        LibRugStorage.Offer storage offer = LibRugStorage.marketplaceStorage().offers[offerId];
        return (
            offer.offerId,
            offer.offerer,
            offer.tokenId,
            offer.price,
            offer.expiresAt,
            offer.isActive
        );
    }

    /**
     * @notice Get all offer IDs for a token
     * @param tokenId Token ID
     * @return offerIds Array of offer IDs
     */
    function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        return LibRugStorage.marketplaceStorage().tokenOffers[tokenId];
    }

    /**
     * @notice Get active offers for a token
     * @param tokenId Token ID
     * @return activeOfferIds Array of active offer IDs
     */
    function getActiveTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256[] memory allOffers = ms.tokenOffers[tokenId];
        
        // Count active offers first
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allOffers.length; i++) {
            LibRugStorage.Offer storage offer = ms.offers[allOffers[i]];
            if (offer.isActive && (offer.expiresAt == 0 || block.timestamp <= offer.expiresAt)) {
                activeCount++;
            }
        }
        
        // Build array of active offers
        uint256[] memory activeOffers = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allOffers.length; i++) {
            LibRugStorage.Offer storage offer = ms.offers[allOffers[i]];
            if (offer.isActive && (offer.expiresAt == 0 || block.timestamp <= offer.expiresAt)) {
                activeOffers[index] = allOffers[i];
                index++;
            }
        }
        
        return activeOffers;
    }

    // ===== ADMIN FUNCTIONS =====

    /**
     * @notice Update marketplace fee
     * @param newFeeBPS New fee in basis points (e.g., 250 = 2.5%)
     */
    function setMarketplaceFee(uint256 newFeeBPS) external {
        // Only diamond owner can update fees (add proper access control)
        require(msg.sender == LibDiamond.contractOwner(), "Not authorized");

        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 oldFee = ms.marketplaceFeePercent;
        ms.marketplaceFeePercent = newFeeBPS;

        emit MarketplaceFeeUpdated(oldFee, newFeeBPS);
    }

    /**
     * @notice Withdraw collected marketplace fees
     * @param to Address to send fees to
     */
    function withdrawFees(address to) external nonReentrant {
        require(msg.sender == LibDiamond.contractOwner(), "Not authorized");
        require(to != address(0), "Invalid recipient");

        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 amount = ms.totalFeesCollected;

        require(amount > 0, "No fees to withdraw");
        require(address(this).balance >= amount, "Insufficient contract balance");

        // CEI pattern: Update state BEFORE external call
        ms.totalFeesCollected = 0;

        // External call AFTER state update
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FeesWithdrawn(to, amount);
    }


    // ===== INTERNAL FUNCTIONS =====

    /**
     * @dev Process payment with fees and royalties
     */
    function _processPayment(uint256 tokenId, address seller, uint256 price) internal {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();

        // Calculate marketplace fee with SafeMath
        uint256 marketplaceFee = LibRugStorage.safeMul(price, ms.marketplaceFeePercent) / 10000;

        // Use the fixed distributeRoyalties function (has pull pattern fallback)
        // This prevents DoS attacks if royalty recipient fails
        RugCommerceFacet commerceFacet = RugCommerceFacet(address(this));
        uint256 royaltyAmount = 0;
        
        // Try to distribute royalties, but don't revert if it fails
        try commerceFacet.distributeRoyalties(tokenId, price, address(this)) {
            // Success - royalties distributed or stored for pull pattern
        } catch {
            // Continue sale even if royalty distribution fails
            // This prevents DoS attacks via malicious royalty recipients
            emit RoyaltyDistributionSkipped(tokenId, price);
        }
        
        // Get royalty amount for seller proceeds calculation
        (, royaltyAmount) = commerceFacet.royaltyInfo(tokenId, price);

        // Calculate seller proceeds after fees and royalties with SafeMath
        uint256 totalDeductions = LibRugStorage.safeAdd(marketplaceFee, royaltyAmount);
        uint256 sellerProceeds = LibRugStorage.safeSub(price, totalDeductions);

        // Record marketplace fees with SafeMath
        ms.totalFeesCollected = LibRugStorage.safeAdd(ms.totalFeesCollected, marketplaceFee);

        // Send proceeds to seller
        (bool success, ) = seller.call{value: sellerProceeds}("");
        if (!success) revert TransferFailed();
    }

}
