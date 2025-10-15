// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";

/**
 * @title RugCommerceFacet
 * @notice Commerce facet for OnchainRugs withdrawals and royalties
 * @dev Handles ETH withdrawals and EIP-2981 royalty system
 */
contract RugCommerceFacet {

    // Events
    event Withdrawn(address indexed to, uint256 amount);
    event RoyaltiesConfigured(uint256 royaltyPercentage, address[] recipients, uint256[] splits);
    event RevenueReceived(uint256 amount, string source);

    // Royalty storage (separate from main storage for EIP-2981 compliance)
    struct RoyaltyConfig {
        uint256 royaltyPercentage; // Basis points (e.g., 500 = 5%)
        address[] recipients;
        uint256[] recipientSplits; // Basis points for each recipient
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

        // Validate splits sum to royalty percentage
        uint256 totalSplits = 0;
        for (uint256 i = 0; i < splits.length; i++) {
            require(splits[i] > 0, "Split must be greater than 0");
            totalSplits += splits[i];
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

        // Calculate total royalty amount
        royaltyAmount = (salePrice * rs.royaltyPercentage) / 10000;

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
        RoyaltyConfig storage rs = royaltyStorage();

        require(rs.recipients.length > 0, "Royalties not configured");
        require(rs.royaltyPercentage > 0, "Royalty percentage not set");

        uint256 totalRoyalty = (salePrice * rs.royaltyPercentage) / 10000;
        require(address(this).balance >= totalRoyalty, "Insufficient contract balance");

        // Distribute to each recipient according to their split
        for (uint256 i = 0; i < rs.recipients.length; i++) {
            uint256 recipientRoyalty = (totalRoyalty * rs.recipientSplits[i]) / rs.royaltyPercentage;

            if (recipientRoyalty > 0) {
                (bool success,) = rs.recipients[i].call{value: recipientRoyalty}("");
                require(success, "Royalty distribution failed");
            }
        }
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
        return (salePrice * rs.royaltyPercentage) / 10000;
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

    // Note: supportsInterface removed to avoid conflict with ERC721's supportsInterface

    // Note: receive() and fallback() functions removed as Diamond handles ETH reception
}
