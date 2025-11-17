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

        // Deactivate listing
        listing.isActive = false;

        // Transfer NFT from seller to buyer FIRST to prevent reentrancy
        // Since marketplace is approved (was approved during listing), this should work
        IERC721(address(this)).transferFrom(seller, msg.sender, tokenId);

        // Process payment with fees and royalties AFTER transfer is complete
        _processPayment(tokenId, seller, price);
        

        // Record sale for laundering tracking (tracks last 3 sale prices)
        RugLaunderingFacet launderingFacet = RugLaunderingFacet(address(this));
        launderingFacet.recordSale(tokenId, seller, msg.sender, price);

        // Update marketplace stats
        ms.totalSales++;
        ms.totalVolume += price;
        
        // Refund excess payment
        if (msg.value > price) {
            (bool success, ) = msg.sender.call{value: msg.value - price}("");
            if (!success) revert TransferFailed();
        }
        
        emit ListingSold(tokenId, seller, msg.sender, price);
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
    function withdrawFees(address to) external {
        require(msg.sender == LibDiamond.contractOwner(), "Not authorized");

        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 amount = ms.totalFeesCollected;

        require(amount > 0, "No fees to withdraw");

        ms.totalFeesCollected = 0;

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

        // Calculate and distribute royalties immediately
        RugCommerceFacet commerceFacet = RugCommerceFacet(address(this));
        (address royaltyRecipient, uint256 royaltyAmount) = commerceFacet.royaltyInfo(tokenId, price);

        // Distribute royalties to recipient if configured
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            (bool royaltySuccess, ) = royaltyRecipient.call{value: royaltyAmount}("");
            if (!royaltySuccess) revert TransferFailed();
        }

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
