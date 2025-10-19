// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {ReentrancyGuard} from "solady/utils/ReentrancyGuard.sol";

/**
 * @title RugMarketplaceFacet
 * @notice Full-featured marketplace for OnchainRugs with listings, auctions, offers, and bundles
 * @dev Integrates with laundering system to track sales and trigger automatic cleaning
 */
contract RugMarketplaceFacet is ReentrancyGuard {
    
    // ===== EVENTS =====
    
    event ListingCreated(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 expiresAt);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event ListingPriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);
    event ListingSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    
    event AuctionCreated(uint256 indexed tokenId, address indexed seller, uint256 startPrice, uint256 reservePrice, uint256 endTime, bool autoExtend);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 bidAmount, uint256 newEndTime);
    event AuctionFinalized(uint256 indexed tokenId, address indexed seller, address indexed winner, uint256 finalPrice);
    event AuctionCancelled(uint256 indexed tokenId, address indexed seller);
    event AuctionExtended(uint256 indexed tokenId, uint256 newEndTime);
    
    event OfferCreated(uint256 indexed offerId, address indexed offerer, uint256 indexed tokenId, uint256 price, uint256 expiresAt);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed tokenId, address indexed seller, address buyer, uint256 price);
    event OfferCancelled(uint256 indexed offerId, address indexed offerer, uint256 refundAmount);
    
    event BundleCreated(uint256 indexed bundleId, address indexed seller, uint256[] tokenIds, uint256 price, uint256 expiresAt);
    event BundleSold(uint256 indexed bundleId, address indexed seller, address indexed buyer, uint256 price);
    event BundleCancelled(uint256 indexed bundleId, address indexed seller);
    
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    // ===== ERRORS =====
    
    error NotTokenOwner();
    error NotListed();
    error ListingExpired();
    error InsufficientPayment();
    error ListingAlreadyExists();
    error AuctionActive();
    error InvalidPrice();
    error InvalidDuration();
    error AuctionNotEnded();
    error NoActiveBid();
    error BidTooLow();
    error ReservePriceNotMet();
    error NotAuctionSeller();
    error AuctionEnded();
    error InvalidOffer();
    error OfferExpired();
    error NotOfferOwner();
    error BundleNotFound();
    error EmptyBundle();
    error TransferFailed();
    
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

        // Check no active listing or auction
        if (listing.isActive) revert ListingAlreadyExists();
        if (ms.auctions[tokenId].isActive) revert AuctionActive();

        // Approve marketplace to transfer NFTs (required for marketplace to work)
        // Only approve if not already approved to avoid unnecessary gas costs
        if (IERC721(address(this)).getApproved(tokenId) != address(this)) {
            IERC721(address(this)).approve(address(this), tokenId);
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
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Deactivate listing
        listing.isActive = false;
        
        // Process payment with fees and royalties
        _processPayment(tokenId, seller, price);
        
        // Transfer NFT
        IERC721(address(this)).transferFrom(seller, msg.sender, tokenId);
        
        // Record sale for laundering
        _recordSale(tokenId, seller, msg.sender, price);
        
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
    
    /**
     * @notice Create multiple listings at once
     * @param tokenIds Array of token IDs
     * @param prices Array of prices
     * @param durations Array of durations
     */
    function bulkCreateListings(
        uint256[] calldata tokenIds,
        uint256[] calldata prices,
        uint256[] calldata durations
    ) external {
        require(tokenIds.length == prices.length && tokenIds.length == durations.length, "Array length mismatch");
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            // Skip if not owner or invalid price
            if (IERC721(address(this)).ownerOf(tokenIds[i]) != msg.sender) continue;
            if (prices[i] == 0) continue;
            
            LibRugStorage.Listing storage listing = ms.listings[tokenIds[i]];
            
            // Skip if already listed or in auction
            if (listing.isActive) continue;
            if (ms.auctions[tokenIds[i]].isActive) continue;

            // Approve marketplace to transfer this NFT
            if (IERC721(address(this)).getApproved(tokenIds[i]) != address(this)) {
                IERC721(address(this)).approve(address(this), tokenIds[i]);
            }

            uint256 expiresAt = durations[i] == 0 ? 0 : block.timestamp + durations[i];
            
            listing.seller = msg.sender;
            listing.price = prices[i];
            listing.expiresAt = expiresAt;
            listing.isActive = true;
            
            emit ListingCreated(tokenIds[i], msg.sender, prices[i], expiresAt);
        }
    }
    
    // ===== AUCTION FUNCTIONS =====
    
    /**
     * @notice Create an auction
     * @param tokenId Token ID to auction
     * @param startPrice Starting bid price
     * @param reservePrice Minimum acceptable price (0 = no reserve)
     * @param duration Auction duration in seconds
     * @param autoExtend Enable auto-extend if bid near end
     */
    function createAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 duration,
        bool autoExtend
    ) external onlyTokenOwner(tokenId) {
        if (startPrice == 0) revert InvalidPrice();
        if (reservePrice > 0 && reservePrice < startPrice) revert InvalidPrice();
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        
        if (duration == 0 || duration > ms.maxAuctionDuration) revert InvalidDuration();
        if (ms.listings[tokenId].isActive) revert ListingAlreadyExists();
        if (ms.auctions[tokenId].isActive) revert AuctionActive();

        // Approve marketplace to transfer NFTs (required for marketplace to work)
        if (IERC721(address(this)).getApproved(tokenId) != address(this)) {
            IERC721(address(this)).approve(address(this), tokenId);
        }

        uint256 endTime = block.timestamp + duration;
        
        LibRugStorage.Auction storage auction = ms.auctions[tokenId];
        auction.seller = msg.sender;
        auction.startPrice = startPrice;
        auction.reservePrice = reservePrice;
        auction.currentBid = 0;
        auction.highestBidder = address(0);
        auction.startTime = block.timestamp;
        auction.endTime = endTime;
        auction.isActive = true;
        auction.autoExtend = autoExtend;
        auction.minBidIncrement = ms.minBidIncrementPercent;
        
        emit AuctionCreated(tokenId, msg.sender, startPrice, reservePrice, endTime, autoExtend);
    }
    
    /**
     * @notice Place a bid on an active auction
     * @param tokenId Token ID being auctioned
     */
    function placeBid(uint256 tokenId) external payable nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Auction storage auction = ms.auctions[tokenId];
        
        if (!auction.isActive) revert NotListed();
        if (block.timestamp >= auction.endTime) revert AuctionEnded();
        
        // Calculate minimum bid
        uint256 minBid = auction.currentBid == 0 
            ? auction.startPrice 
            : auction.currentBid + (auction.currentBid * auction.minBidIncrement / 10000);
        
        if (msg.value < minBid) revert BidTooLow();
        
        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            (bool success, ) = auction.highestBidder.call{value: auction.currentBid}("");
            if (!success) revert TransferFailed();
        }
        
        // Update auction
        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;
        
        // Auto-extend if enabled and bid is near end
        uint256 newEndTime = auction.endTime;
        if (auction.autoExtend && (auction.endTime - block.timestamp) <= ms.autoExtendThreshold) {
            newEndTime = block.timestamp + ms.autoExtendDuration;
            auction.endTime = newEndTime;
            emit AuctionExtended(tokenId, newEndTime);
        }
        
        emit BidPlaced(tokenId, msg.sender, msg.value, newEndTime);
    }
    
    /**
     * @notice Finalize an auction after it ends
     * @param tokenId Token ID
     */
    function finalizeAuction(uint256 tokenId) external nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Auction storage auction = ms.auctions[tokenId];
        
        if (!auction.isActive) revert NotListed();
        if (block.timestamp < auction.endTime) revert AuctionNotEnded();
        
        auction.isActive = false;
        
        // If no bids or reserve not met, return NFT to seller
        if (auction.highestBidder == address(0)) {
            emit AuctionCancelled(tokenId, auction.seller);
            return;
        }
        
        if (auction.reservePrice > 0 && auction.currentBid < auction.reservePrice) {
            // Refund highest bidder
            (bool success, ) = auction.highestBidder.call{value: auction.currentBid}("");
            if (!success) revert TransferFailed();
            emit AuctionCancelled(tokenId, auction.seller);
            return;
        }
        
        address seller = auction.seller;
        address winner = auction.highestBidder;
        uint256 finalPrice = auction.currentBid;
        
        // Process payment with fees and royalties
        _processPaymentFromEscrow(tokenId, seller, finalPrice);
        
        // Transfer NFT
        IERC721(address(this)).transferFrom(seller, winner, tokenId);
        
        // Record sale for laundering
        _recordSale(tokenId, seller, winner, finalPrice);
        
        // Update marketplace stats
        ms.totalSales++;
        ms.totalVolume += finalPrice;
        
        emit AuctionFinalized(tokenId, seller, winner, finalPrice);
    }
    
    /**
     * @notice Cancel an auction (only if no bids)
     * @param tokenId Token ID
     */
    function cancelAuction(uint256 tokenId) external {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Auction storage auction = ms.auctions[tokenId];
        
        if (!auction.isActive) revert NotListed();
        if (auction.seller != msg.sender) revert NotAuctionSeller();
        if (auction.highestBidder != address(0)) revert NoActiveBid();
        
        auction.isActive = false;
        
        emit AuctionCancelled(tokenId, msg.sender);
    }
    
    // ===== OFFER FUNCTIONS =====
    
    /**
     * @notice Make an offer on a specific token (escrow ETH)
     * @param tokenId Token ID to make offer on
     * @param expiresAt Expiration timestamp (0 = no expiration)
     */
    function makeOffer(uint256 tokenId, uint256 expiresAt) external payable nonReentrant {
        if (msg.value == 0) revert InvalidPrice();
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidDuration();
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 offerId = ++ms.nextOfferId;
        
        LibRugStorage.Offer storage offer = ms.offers[offerId];
        offer.offerId = offerId;
        offer.offerer = msg.sender;
        offer.tokenId = tokenId;
        offer.price = msg.value;
        offer.expiresAt = expiresAt;
        offer.isActive = true;
        
        // Track offer for this token
        ms.tokenOffers[tokenId].push(offerId);
        
        emit OfferCreated(offerId, msg.sender, tokenId, msg.value, expiresAt);
    }
    
    /**
     * @notice Make a collection-wide offer (escrow ETH)
     * @param expiresAt Expiration timestamp
     */
    function makeCollectionOffer(uint256 expiresAt) external payable nonReentrant {
        if (msg.value == 0) revert InvalidPrice();
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidDuration();
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 offerId = ++ms.nextOfferId;
        
        LibRugStorage.Offer storage offer = ms.offers[offerId];
        offer.offerId = offerId;
        offer.offerer = msg.sender;
        offer.tokenId = 0; // 0 indicates collection-wide
        offer.price = msg.value;
        offer.expiresAt = expiresAt;
        offer.isActive = true;
        
        ms.collectionOffers.push(offerId);
        
        emit OfferCreated(offerId, msg.sender, 0, msg.value, expiresAt);
    }
    
    /**
     * @notice Accept an offer
     * @param tokenId Token ID
     * @param offerId Offer ID to accept
     */
    function acceptOffer(uint256 tokenId, uint256 offerId) 
        external 
        onlyTokenOwner(tokenId) 
        nonReentrant 
    {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Offer storage offer = ms.offers[offerId];
        
        if (!offer.isActive) revert InvalidOffer();
        if (offer.expiresAt != 0 && block.timestamp > offer.expiresAt) revert OfferExpired();
        
        // Validate offer is for this token or collection-wide
        if (offer.tokenId != 0 && offer.tokenId != tokenId) revert InvalidOffer();
        
        address buyer = offer.offerer;
        uint256 price = offer.price;
        
        // Deactivate offer
        offer.isActive = false;
        
        // Cancel any active listing
        if (ms.listings[tokenId].isActive) {
            ms.listings[tokenId].isActive = false;
        }
        
        // Process payment from escrow
        _processPaymentFromEscrow(tokenId, msg.sender, price);
        
        // Transfer NFT
        IERC721(address(this)).transferFrom(msg.sender, buyer, tokenId);
        
        // Record sale for laundering
        _recordSale(tokenId, msg.sender, buyer, price);
        
        // Update marketplace stats
        ms.totalSales++;
        ms.totalVolume += price;
        
        emit OfferAccepted(offerId, tokenId, msg.sender, buyer, price);
    }
    
    /**
     * @notice Cancel an offer and get refund
     * @param offerId Offer ID to cancel
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Offer storage offer = ms.offers[offerId];
        
        if (!offer.isActive) revert InvalidOffer();
        if (offer.offerer != msg.sender) revert NotOfferOwner();
        
        uint256 refundAmount = offer.price;
        offer.isActive = false;
        
        // Refund escrowed ETH
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();
        
        emit OfferCancelled(offerId, msg.sender, refundAmount);
    }
    
    // ===== BUNDLE FUNCTIONS =====
    
    /**
     * @notice Create a bundle listing
     * @param tokenIds Array of token IDs to bundle
     * @param price Bundle price
     * @param duration Listing duration
     */
    function createBundle(
        uint256[] calldata tokenIds,
        uint256 price,
        uint256 duration
    ) external {
        if (tokenIds.length == 0) revert EmptyBundle();
        if (price == 0) revert InvalidPrice();
        
        // Verify ownership of all tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (IERC721(address(this)).ownerOf(tokenIds[i]) != msg.sender) revert NotTokenOwner();
        }
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 bundleId = ++ms.nextBundleId;
        uint256 expiresAt = duration == 0 ? 0 : block.timestamp + duration;
        
        LibRugStorage.Bundle storage bundle = ms.bundles[bundleId];
        bundle.bundleId = bundleId;
        bundle.seller = msg.sender;
        bundle.tokenIds = tokenIds;
        bundle.price = price;
        bundle.expiresAt = expiresAt;
        bundle.isActive = true;
        
        emit BundleCreated(bundleId, msg.sender, tokenIds, price, expiresAt);
    }
    
    /**
     * @notice Buy a bundle
     * @param bundleId Bundle ID to purchase
     */
    function buyBundle(uint256 bundleId) external payable nonReentrant {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Bundle storage bundle = ms.bundles[bundleId];
        
        if (!bundle.isActive) revert BundleNotFound();
        if (bundle.expiresAt != 0 && block.timestamp > bundle.expiresAt) revert ListingExpired();
        if (msg.value < bundle.price) revert InsufficientPayment();
        
        address seller = bundle.seller;
        uint256 price = bundle.price;
        uint256[] memory tokenIds = bundle.tokenIds;
        
        bundle.isActive = false;
        
        // Calculate fees for bundle (single fee on total)
        uint256 marketplaceFee = (price * ms.marketplaceFeePercent) / 10000;
        uint256 sellerAmount = price - marketplaceFee;
        ms.totalFeesCollected += marketplaceFee;
        
        // Pay seller
        (bool success, ) = seller.call{value: sellerAmount}("");
        if (!success) revert TransferFailed();
        
        // Transfer all NFTs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(address(this)).transferFrom(seller, msg.sender, tokenIds[i]);
            
            // Record each sale for laundering
            _recordSale(tokenIds[i], seller, msg.sender, price / tokenIds.length);
        }
        
        // Update marketplace stats
        ms.totalSales++;
        ms.totalVolume += price;
        
        // Refund excess
        if (msg.value > price) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - price}("");
            if (!refundSuccess) revert TransferFailed();
        }
        
        emit BundleSold(bundleId, seller, msg.sender, price);
    }
    
    /**
     * @notice Cancel a bundle
     * @param bundleId Bundle ID
     */
    function cancelBundle(uint256 bundleId) external {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        LibRugStorage.Bundle storage bundle = ms.bundles[bundleId];
        
        if (!bundle.isActive) revert BundleNotFound();
        if (bundle.seller != msg.sender) revert NotTokenOwner();
        
        bundle.isActive = false;
        
        emit BundleCancelled(bundleId, msg.sender);
    }
    
    // ===== ADMIN FUNCTIONS =====
    
    /**
     * @notice Set marketplace fee percentage
     * @param feePercent Fee in basis points (250 = 2.5%)
     */
    function setMarketplaceFee(uint256 feePercent) external {
        LibDiamond.enforceIsContractOwner();
        require(feePercent <= 1000, "Fee too high"); // Max 10%
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 oldFee = ms.marketplaceFeePercent;
        ms.marketplaceFeePercent = feePercent;
        
        emit MarketplaceFeeUpdated(oldFee, feePercent);
    }
    
    /**
     * @notice Set maximum auction duration
     * @param duration Maximum duration in seconds
     */
    function setMaxAuctionDuration(uint256 duration) external {
        LibDiamond.enforceIsContractOwner();
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        ms.maxAuctionDuration = duration;
    }
    
    /**
     * @notice Set minimum bid increment percentage
     * @param percent Percentage in basis points (500 = 5%)
     */
    function setMinBidIncrement(uint256 percent) external {
        LibDiamond.enforceIsContractOwner();
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        ms.minBidIncrementPercent = percent;
    }
    
    /**
     * @notice Withdraw collected marketplace fees
     */
    function withdrawMarketplaceFees() external {
        LibDiamond.enforceIsContractOwner();
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        uint256 amount = ms.totalFeesCollected;
        
        require(amount > 0, "No fees to withdraw");
        ms.totalFeesCollected = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit FeesWithdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Initialize marketplace config with defaults
     */
    function initializeMarketplace() external {
        LibDiamond.enforceIsContractOwner();
        
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        
        // Only initialize once
        require(ms.marketplaceFeePercent == 0, "Already initialized");
        
        ms.marketplaceFeePercent = 250; // 2.5%
        ms.maxAuctionDuration = 7 days;
        ms.minBidIncrementPercent = 500; // 5%
        ms.autoExtendDuration = 10 minutes;
        ms.autoExtendThreshold = 10 minutes;
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
     * @notice Get auction details
     */
    function getAuction(uint256 tokenId) external view returns (
        address seller,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 currentBid,
        address highestBidder,
        uint256 endTime,
        bool isActive,
        bool autoExtend
    ) {
        LibRugStorage.Auction storage auction = LibRugStorage.marketplaceStorage().auctions[tokenId];
        return (
            auction.seller,
            auction.startPrice,
            auction.reservePrice,
            auction.currentBid,
            auction.highestBidder,
            auction.endTime,
            auction.isActive,
            auction.autoExtend
        );
    }
    
    /**
     * @notice Get offer details
     */
    function getOffer(uint256 offerId) external view returns (
        address offerer,
        uint256 tokenId,
        uint256 price,
        uint256 expiresAt,
        bool isActive
    ) {
        LibRugStorage.Offer storage offer = LibRugStorage.marketplaceStorage().offers[offerId];
        return (offer.offerer, offer.tokenId, offer.price, offer.expiresAt, offer.isActive);
    }
    
    /**
     * @notice Get all offers for a token
     */
    function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        return LibRugStorage.marketplaceStorage().tokenOffers[tokenId];
    }
    
    /**
     * @notice Get all collection-wide offers
     */
    function getCollectionOffers() external view returns (uint256[] memory) {
        return LibRugStorage.marketplaceStorage().collectionOffers;
    }
    
    /**
     * @notice Get bundle details
     */
    function getBundle(uint256 bundleId) external view returns (
        address seller,
        uint256[] memory tokenIds,
        uint256 price,
        uint256 expiresAt,
        bool isActive
    ) {
        LibRugStorage.Bundle storage bundle = LibRugStorage.marketplaceStorage().bundles[bundleId];
        return (bundle.seller, bundle.tokenIds, bundle.price, bundle.expiresAt, bundle.isActive);
    }
    
    /**
     * @notice Get marketplace stats
     */
    function getMarketplaceStats() external view returns (
        uint256 totalSales,
        uint256 totalVolume,
        uint256 totalFeesCollected,
        uint256 marketplaceFeePercent
    ) {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        return (ms.totalSales, ms.totalVolume, ms.totalFeesCollected, ms.marketplaceFeePercent);
    }
    
    /**
     * @notice Get marketplace configuration
     */
    function getMarketplaceConfig() external view returns (
        uint256 marketplaceFeePercent,
        uint256 maxAuctionDuration,
        uint256 minBidIncrementPercent,
        uint256 autoExtendDuration,
        uint256 autoExtendThreshold
    ) {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        return (
            ms.marketplaceFeePercent,
            ms.maxAuctionDuration,
            ms.minBidIncrementPercent,
            ms.autoExtendDuration,
            ms.autoExtendThreshold
        );
    }
    
    // ===== INTERNAL HELPER FUNCTIONS =====
    
    /**
     * @notice Process payment with marketplace fees and royalties
     * @param tokenId Token being sold
     * @param seller Seller address
     * @param price Sale price
     */
    function _processPayment(uint256 tokenId, address seller, uint256 price) internal {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        
        // Calculate marketplace fee
        uint256 marketplaceFee = (price * ms.marketplaceFeePercent) / 10000;
        uint256 remaining = price - marketplaceFee;
        ms.totalFeesCollected += marketplaceFee;
        
        // Calculate and pay royalty (EIP-2981)
        try IERC2981(address(this)).royaltyInfo(tokenId, remaining) returns (
            address royaltyReceiver,
            uint256 royaltyAmount
        ) {
            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                remaining -= royaltyAmount;
                (bool royaltySuccess, ) = royaltyReceiver.call{value: royaltyAmount}("");
                if (!royaltySuccess) revert TransferFailed();
            }
        } catch {
            // No royalty configured
        }
        
        // Pay seller
        (bool sellerSuccess, ) = seller.call{value: remaining}("");
        if (!sellerSuccess) revert TransferFailed();
    }
    
    /**
     * @notice Process payment from escrowed funds
     * @param tokenId Token being sold
     * @param seller Seller address
     * @param price Sale price (already in contract)
     */
    function _processPaymentFromEscrow(uint256 tokenId, address seller, uint256 price) internal {
        LibRugStorage.MarketplaceConfig storage ms = LibRugStorage.marketplaceStorage();
        
        // Calculate marketplace fee
        uint256 marketplaceFee = (price * ms.marketplaceFeePercent) / 10000;
        uint256 remaining = price - marketplaceFee;
        ms.totalFeesCollected += marketplaceFee;
        
        // Calculate and pay royalty
        try IERC2981(address(this)).royaltyInfo(tokenId, remaining) returns (
            address royaltyReceiver,
            uint256 royaltyAmount
        ) {
            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                remaining -= royaltyAmount;
                (bool royaltySuccess, ) = royaltyReceiver.call{value: royaltyAmount}("");
                if (!royaltySuccess) revert TransferFailed();
            }
        } catch {
            // No royalty configured
        }
        
        // Pay seller
        (bool sellerSuccess, ) = seller.call{value: remaining}("");
        if (!sellerSuccess) revert TransferFailed();
    }
    
    /**
     * @notice Record sale in laundering facet
     * @param tokenId Token ID
     * @param from Seller
     * @param to Buyer
     * @param price Sale price
     */
    function _recordSale(uint256 tokenId, address from, address to, uint256 price) internal {
        // Call RugLaunderingFacet.recordSale through diamond
        (bool success, ) = address(this).call(
            abi.encodeWithSignature(
                "recordSale(uint256,address,address,uint256)",
                tokenId,
                from,
                to,
                price
            )
        );
        // Don't revert if recording fails, just continue with sale
        if (!success) {
            // Laundering record failed, but sale succeeded
        }
    }
}

