// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RugMarketplace
 * @dev Integrated marketplace for OnchainRugs with escrow functionality
 */
contract RugMarketplace is Ownable {
    // Reference to the main NFT contract
    IERC721 public rugsContract;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    // tokenId => Listing
    mapping(uint256 => Listing) public listings;

    // Events
    event RugListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event RugDelisted(uint256 indexed tokenId, address indexed seller);
    event RugSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    constructor(address _rugsContract) Ownable(msg.sender) {
        rugsContract = IERC721(_rugsContract);
    }

    /**
     * @dev List a rug for sale
     * @param tokenId The token ID to list
     * @param price The sale price in wei
     */
    function listRug(uint256 tokenId, uint256 price) external {
        require(rugsContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].active, "Already listed");

        // Transfer NFT to this contract (escrow)
        rugsContract.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        emit RugListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Remove listing and return NFT to seller
     * @param tokenId The token ID to delist
     */
    function delistRug(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        // Return NFT to seller
        rugsContract.transferFrom(address(this), msg.sender, tokenId);

        delete listings[tokenId];

        emit RugDelisted(tokenId, msg.sender);
    }

    /**
     * @dev Purchase a listed rug
     * @param tokenId The token ID to purchase
     */
    function buyRug(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        // Mark as inactive first (reentrancy protection)
        listings[tokenId].active = false;

        // Transfer NFT to buyer
        rugsContract.transferFrom(address(this), msg.sender, tokenId);

        // Transfer payment to seller
        payable(listing.seller).transfer(listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit RugSold(tokenId, listing.seller, msg.sender, listing.price);

        // Clean up storage
        delete listings[tokenId];
    }

    /**
     * @dev Update listing price
     * @param tokenId The token ID to update
     * @param newPrice The new price
     */
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");

        listing.price = newPrice;

        // Re-emit listing event with new price
        emit RugListed(tokenId, msg.sender, newPrice);
    }

    /**
     * @dev Get all active listings (for frontend)
     * Note: This is not gas efficient for production - use events instead
     */
    function getActiveListings() external view returns (uint256[] memory) {
        // This is a simplified version - in production you'd use events
        // and pagination for better performance
        uint256[] memory activeListings = new uint256[](1111); // Max supply
        uint256 count = 0;

        for (uint256 i = 1; i <= 1111; i++) {
            if (listings[i].active) {
                activeListings[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        assembly {
            mstore(activeListings, count)
        }

        return activeListings;
    }

    /**
     * @dev Emergency function to recover stuck NFTs (owner only)
     * @param tokenId The token ID to recover
     * @param to Address to send the NFT to
     */
    function emergencyRecover(uint256 tokenId, address to) external onlyOwner {
        require(rugsContract.ownerOf(tokenId) == address(this), "Not owned by marketplace");

        rugsContract.transferFrom(address(this), to, tokenId);

        // If it was listed, clean up the listing
        if (listings[tokenId].active) {
            delete listings[tokenId];
        }
    }

    /**
     * @dev Withdraw any accidentally sent ETH (owner only)
     */
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // ============ MARKETPLACE FEES ============
    // Future: Add marketplace fees, royalties, etc.

    // ============ AUCTION FUNCTIONALITY ============
    // Future: Add Dutch auctions, English auctions, etc.
}
