// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibBase62} from "../libraries/LibBase62.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RugAttributionRegistryFacet
 * @notice Registry for ERC-8021 transaction attribution codes
 * @dev Allows users to register attribution codes and tracks attribution statistics
 */
contract RugAttributionRegistryFacet {
    using Strings for uint256;

    // Events
    event AttributionCodeRegistered(address indexed referrer, string code);
    event AttributionCodeUpdated(address indexed referrer, string oldCode, string newCode);
    event AttributionRewardPaid(
        address indexed referrer,
        address indexed referee,
        uint256 indexed tokenId,
        string action,  // "mint", "buy", etc.
        uint256 rewardAmount
    );

    // Errors
    error AttributionSystemDisabled();
    error CodeAlreadyTaken();
    error CodeTooShort();
    error CodeTooLong();
    error InvalidCodeFormat();
    error ReferrerAlreadyRegistered();
    error CannotReferSelf();

    // Constants
    uint256 private constant MIN_CODE_LENGTH = 3;
    uint256 private constant MAX_CODE_LENGTH = 20;

    /**
     * @notice Register an ERC-8021 attribution code for the caller
     * @param _code Attribution code (e.g., "alice123" - base62 format)
     * @dev Code must be unique, 3-20 characters, valid base62 format
     */

    function registerAttributionCode(string memory _code) external {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        
        // Initialize storage if needed
        if (rs.minCodeLength == 0) {
            rs.minCodeLength = MIN_CODE_LENGTH;
            rs.maxCodeLength = MAX_CODE_LENGTH;
        }

        // Validate code format
        bytes memory codeBytes = bytes(_code);
        uint256 codeLength = codeBytes.length;

        // Check minimum length (at least 3 chars for base62 code)
        if (codeLength < 3) revert CodeTooShort();

        // Validate the code is valid base62
        if (!LibBase62.isValidBase62(_code)) revert InvalidCodeFormat();

        // Validate length
        uint256 actualCodeLength = codeLength;
        if (actualCodeLength < rs.minCodeLength) revert CodeTooShort();
        if (actualCodeLength > rs.maxCodeLength) revert CodeTooLong();
        
        // Check if user already has a code
        string memory existingCode = rs.referrerToCode[msg.sender];
        if (bytes(existingCode).length > 0) revert ReferrerAlreadyRegistered();
        
        // Check if code is already taken
        if (rs.codeExists[_code]) revert CodeAlreadyTaken();

        // Register code
        rs.codeToReferrer[_code] = msg.sender;
        rs.referrerToCode[msg.sender] = _code;
        rs.codeExists[_code] = true;

        emit AttributionCodeRegistered(msg.sender, _code);
    }

    /**
     * @notice Register wallet for deterministic ERC-8021 attribution system
     * @dev Generates deterministic 8-character code from wallet address
     *      Requires gas payment as anti-abuse measure
     */
    function registerForAttribution() external {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();

        // Check if referral system is enabled
        if (!rs.referralSystemEnabled) revert AttributionSystemDisabled();

        // Check if already registered
        if (rs.registeredReferrers[msg.sender]) revert ReferrerAlreadyRegistered();

        // Generate deterministic short code
        string memory fullCode = LibBase62.generateAttributionCode(msg.sender);

        // Verify code uniqueness (should be guaranteed by determinism, but double-check)
        if (rs.codeExists[fullCode]) {
            revert("Code collision detected"); // Should never happen
        }

        // Register mappings
        rs.registeredReferrers[msg.sender] = true;
        rs.codeToReferrer[fullCode] = msg.sender;
        rs.referrerToCode[msg.sender] = fullCode;
        rs.codeExists[fullCode] = true;

        // Initialize stats
        rs.referralStats[msg.sender] = LibRugStorage.ReferralStats(0, 0, block.timestamp);

        emit AttributionCodeRegistered(msg.sender, fullCode);
    }

    /**
     * @notice Get referral code for a wallet (deterministic)
     * @param wallet The wallet address
     * @return The referral code if registered, empty string otherwise
     */
    function getAttributionCode(address wallet) external view returns (string memory) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();

        if (!rs.registeredReferrers[wallet]) {
            return "";
        }

        return rs.referrerToCode[wallet];
    }

    /**
     * @notice Generate short code for wallet (public for frontend use)
     * @param wallet The wallet address
     * @return Short alphanumeric code
     * @dev Public function for frontend to generate codes without registration
     */
    function generateAttributionCode(address wallet) external pure returns (string memory) {
        return LibBase62.generateAttributionCode(wallet);
    }

    /**
     * @notice Check if wallet is registered for referrals
     * @param wallet The wallet address to check
     * @return True if registered
     */
    function isAttributionRegistered(address wallet) external view returns (bool) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        return rs.registeredReferrers[wallet];
    }

    /**
     * @notice Get referrer address for a given referral code
     * @param code Referral code
     * @return referrer Address of the referrer, or address(0) if not found
     */
    function getReferrerFromAttributionCode(string memory code) external view returns (address) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        return rs.codeToReferrer[code];
    }

    /**
     * @notice Get referral code for a given address
     * @param referrer Address of the referrer
     * @return code Referral code, or empty string if not registered
     */
    function getCodeFromReferrer(address referrer) external view returns (string memory) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        return rs.referrerToCode[referrer];
    }

    /**
     * @notice Check if a referral code exists
     * @param code Referral code to check
     * @return exists True if code is registered
     */
    function codeExists(string memory code) external view returns (bool) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        return rs.codeExists[code];
    }

    /**
     * @notice Get ERC-8021 attribution statistics for an address
     * @param referrer Address of the referrer
     * @return totalAttributions Total number of successful attributions
     * @return totalEarned Total ETH earned from attributions
     * @return lastAttributionTime Timestamp of last attribution
     */
    function getAttributionStats(address referrer)
        external
        view
        returns (
            uint256 totalAttributions,
            uint256 totalEarned,
            uint256 lastAttributionTime
        )
    {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        LibRugStorage.ReferralStats memory stats = rs.referralStats[referrer];

        return (stats.totalReferrals, stats.totalEarned, stats.lastReferralTime);
    }

    /**
     * @notice Get referral configuration
     * @return enabled Whether referral system is enabled
     * @return mintPercent Referral percentage for mints (basis points)
     * @return marketplacePercent Referral percentage for marketplace (basis points)
     */
    function getAttributionConfig()
        external
        view
        returns (
            bool enabled,
            uint256 mintPercent,
            uint256 marketplacePercent
        )
    {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        return (
            rs.referralSystemEnabled,
            rs.mintReferralPercent,
            rs.marketplaceReferralPercent
        );
    }

    /**
     * @notice Extract referrer from attribution codes
     * @param codes Array of attribution codes from ERC-8021
     * @param referee Address of the person using the referral code (to prevent self-referral)
     * @return referrer Address of referrer if referral code found, address(0) otherwise
     * @dev Looks for registered base62 referral codes and prevents self-referral
     */
    function extractReferrerFromAttributionCodes(string[] memory codes, address referee)
        external
        view
        returns (address)
    {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();

        for (uint256 i = 0; i < codes.length; i++) {
            string memory code = codes[i];

            // Check if code is registered (direct lookup, no prefix check needed)
            if (rs.codeExists[code]) {
                address referrer = rs.codeToReferrer[code];

                // Prevent self-referral
                if (referrer != address(0) && referrer != referee) {
                    return referrer;
                }
            }
        }

        return address(0);
    }

    /**
     * @notice Record a successful referral and update statistics
     * @param referrer Address of the referrer
     * @param referee Address that used the referral code
     * @param tokenId Token ID involved (mint or purchase)
     * @param action Action type ("mint", "buy", etc.)
     * @param rewardAmount Amount of reward paid to referrer
     * @dev Called by mint/marketplace functions after reward is paid
     */
    function recordAttribution(
        address referrer,
        address referee,
        uint256 tokenId,
        string memory action,
        uint256 rewardAmount
    ) external {
        // Only callable by this contract (diamond pattern - other facets can call via address(this))
        require(msg.sender == address(this) || msg.sender == LibDiamond.contractOwner(), "Unauthorized");
        
        // Prevent self-referral
        if (referrer == referee) revert CannotReferSelf();
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        
        // Check if referral system is enabled
        if (!rs.referralSystemEnabled) revert AttributionSystemDisabled();
        
        // Update statistics
        LibRugStorage.ReferralStats storage stats = rs.referralStats[referrer];
        stats.totalReferrals++;
        stats.totalEarned += rewardAmount;
        stats.lastReferralTime = block.timestamp;
        
        // Emit event
        emit AttributionRewardPaid(referrer, referee, tokenId, action, rewardAmount);
    }

    /**
     * @notice Calculate ERC-8021 attribution reward amount for mint
     * @param mintFee Total mint fee paid
     * @return rewardAmount Attribution reward amount in wei
     */
    function calculateMintAttributionReward(uint256 mintFee) external view returns (uint256) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        if (!rs.referralSystemEnabled || rs.mintReferralPercent == 0) {
            return 0;
        }
        return (mintFee * rs.mintReferralPercent) / 10000;
    }

    /**
     * @notice Calculate ERC-8021 attribution reward amount for marketplace transaction
     * @param marketplaceFee Total marketplace fee
     * @return rewardAmount Attribution reward amount in wei
     */
    function calculateMarketplaceAttributionReward(uint256 marketplaceFee) external view returns (uint256) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        if (!rs.referralSystemEnabled || rs.marketplaceReferralPercent == 0) {
            return 0;
        }
        return (marketplaceFee * rs.marketplaceReferralPercent) / 10000;
    }

    /**
     * @notice Enable or disable ERC-8021 attribution system (admin only)
     * @param enabled Whether to enable the attribution system
     */
    function setAttributionSystemEnabled(bool enabled) external {
        LibDiamond.enforceIsContractOwner();
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        rs.referralSystemEnabled = enabled;
    }

    /**
     * @notice Set ERC-8021 attribution reward percentages (admin only)
     * @param mintPercent Percentage of mint fee for attribution (basis points, e.g., 250 = 2.5%)
     * @param marketplacePercent Percentage of marketplace fee for attribution (basis points, e.g., 250 = 2.5%)
     * @dev Default: 2.5% for both (250 basis points)
     */
    function setAttributionPercentages(uint256 mintPercent, uint256 marketplacePercent) external {
        LibDiamond.enforceIsContractOwner();
        
        // Validate percentages (max 50% = 5000 basis points)
        require(mintPercent <= 5000, "Mint attribution percent too high");
        require(marketplacePercent <= 5000, "Marketplace referral percent too high");
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        rs.mintReferralPercent = mintPercent;
        rs.marketplaceReferralPercent = marketplacePercent;
    }

    /**
     * @notice Initialize referral system with default 5% percentages (admin only, one-time setup)
     * @dev Sets default percentages to 5% (500 basis points) for both mint and marketplace
     */
    function initializeAttributionSystem() external {
        LibDiamond.enforceIsContractOwner();
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        
        // Only initialize if not already set
        if (rs.mintReferralPercent == 0 && rs.marketplaceReferralPercent == 0) {
            rs.mintReferralPercent = 250; // 2.5%
            rs.marketplaceReferralPercent = 250; // 2.5%
            rs.minCodeLength = MIN_CODE_LENGTH;
            rs.maxCodeLength = MAX_CODE_LENGTH;
        }
    }

    /**
     * @notice Set code length limits (admin only)
     * @param minLength Minimum code length for base62 attribution codes
     * @param maxLength Maximum code length for base62 attribution codes
     */
    function setCodeLengthLimits(uint256 minLength, uint256 maxLength) external {
        LibDiamond.enforceIsContractOwner();
        require(minLength >= 1 && minLength <= 10, "Invalid min length");
        require(maxLength >= minLength && maxLength <= 50, "Invalid max length");
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        rs.minCodeLength = minLength;
        rs.maxCodeLength = maxLength;
    }

}

