// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RugReferralRegistryFacet
 * @notice Registry for user referral codes using ERC-8021 attribution
 * @dev Allows users to register referral codes and tracks referral statistics
 */
contract RugReferralRegistryFacet {
    using Strings for uint256;

    // Events
    event ReferralCodeRegistered(address indexed referrer, string code);
    event ReferralCodeUpdated(address indexed referrer, string oldCode, string newCode);
    event ReferralRewardPaid(
        address indexed referrer,
        address indexed referee,
        uint256 indexed tokenId,
        string action,  // "mint", "buy", etc.
        uint256 rewardAmount
    );

    // Errors
    error ReferralSystemDisabled();
    error CodeAlreadyTaken();
    error CodeTooShort();
    error CodeTooLong();
    error InvalidCodeFormat();
    error CodeNotRegistered();
    error ReferrerAlreadyRegistered();
    error NoCodeRegistered();
    error CannotReferSelf();

    // Constants
    string private constant REFERRAL_PREFIX = "ref-";
    uint256 private constant MIN_CODE_LENGTH = 3;
    uint256 private constant MAX_CODE_LENGTH = 20;

    /**
     * @notice Register a referral code for the caller
     * @param _code Referral code (e.g., "alice123" will be stored as "ref-alice123")
     * @dev Code must be unique, 3-20 characters, and start with "ref-"
     */

    function registerReferralCode(string memory _code) external {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        
        // Initialize storage if needed
        if (rs.minCodeLength == 0) {
            rs.minCodeLength = MIN_CODE_LENGTH;
            rs.maxCodeLength = MAX_CODE_LENGTH;
        }

        // Validate code format
        bytes memory codeBytes = bytes(_code);
        uint256 codeLength = codeBytes.length;

        // Check if code starts with "ref-"
        if (codeLength < 7) revert CodeTooShort(); // "ref-" + at least 3 chars = 7 minimum
        if (!_startsWith(_code, REFERRAL_PREFIX)) revert InvalidCodeFormat();

        // Extract actual code part (after "ref-")
        string memory actualCode = _code;
        
        // Validate length (actual code part should be 3-20 chars)
        uint256 actualCodeLength = codeLength - 4; // Subtract "ref-" length
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

        emit ReferralCodeRegistered(msg.sender, _code);
    }

    /**
     * @notice Get referrer address for a given referral code
     * @param code Referral code
     * @return referrer Address of the referrer, or address(0) if not found
     */
    function getReferrerFromCode(string memory code) external view returns (address) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        return rs.codeToReferrer[code];
    }

    /**
     * @notice Get referral code for a given address
     * @param referrer Address of the referrer
     * @return code Referral code, or empty string if not registered
     */
    function getCodeFromReferrer(address referrer) external view returns (string memory) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        return rs.referrerToCode[referrer];
    }

    /**
     * @notice Check if a referral code exists
     * @param code Referral code to check
     * @return exists True if code is registered
     */
    function codeExists(string memory code) external view returns (bool) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        return rs.codeExists[code];
    }

    /**
     * @notice Get referral statistics for an address
     * @param referrer Address of the referrer
     * @return totalReferrals Total number of successful referrals
     * @return totalEarned Total ETH earned from referrals
     * @return lastReferralTime Timestamp of last referral
     */
    function getReferralStats(address referrer) 
        external 
        view 
        returns (
            uint256 totalReferrals,
            uint256 totalEarned,
            uint256 lastReferralTime
        ) 
    {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        LibRugStorage.ReferralStats memory stats = rs.referralStats[referrer];
        
        return (stats.totalReferrals, stats.totalEarned, stats.lastReferralTime);
    }

    /**
     * @notice Get referral configuration
     * @return enabled Whether referral system is enabled
     * @return mintPercent Referral percentage for mints (basis points)
     * @return marketplacePercent Referral percentage for marketplace (basis points)
     */
    function getReferralConfig() 
        external 
        view 
        returns (
            bool enabled,
            uint256 mintPercent,
            uint256 marketplacePercent
        ) 
    {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
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
     * @dev Looks for codes starting with "ref-" prefix and prevents self-referral
     */
    function extractReferrerFromCodes(string[] memory codes, address referee) 
        external 
        view 
        returns (address) 
    {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        
        for (uint256 i = 0; i < codes.length; i++) {
            string memory code = codes[i];
            
            // Check if code starts with "ref-"
            if (_startsWith(code, REFERRAL_PREFIX)) {
                // Check if code is registered
                if (rs.codeExists[code]) {
                    address referrer = rs.codeToReferrer[code];
                    
                    // Prevent self-referral
                    if (referrer != address(0) && referrer != referee) {
                        return referrer;
                    }
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
    function recordReferral(
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
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        
        // Check if referral system is enabled
        if (!rs.referralSystemEnabled) revert ReferralSystemDisabled();
        
        // Update statistics
        LibRugStorage.ReferralStats storage stats = rs.referralStats[referrer];
        stats.totalReferrals++;
        stats.totalEarned += rewardAmount;
        stats.lastReferralTime = block.timestamp;
        
        // Emit event
        emit ReferralRewardPaid(referrer, referee, tokenId, action, rewardAmount);
    }

    /**
     * @notice Calculate referral reward amount for mint
     * @param mintFee Total mint fee paid
     * @return rewardAmount Referral reward amount in wei
     */
    function calculateMintReferralReward(uint256 mintFee) external view returns (uint256) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        if (!rs.referralSystemEnabled || rs.mintReferralPercent == 0) {
            return 0;
        }
        return (mintFee * rs.mintReferralPercent) / 10000;
    }

    /**
     * @notice Calculate referral reward amount for marketplace transaction
     * @param marketplaceFee Total marketplace fee
     * @return rewardAmount Referral reward amount in wei
     */
    function calculateMarketplaceReferralReward(uint256 marketplaceFee) external view returns (uint256) {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        if (!rs.referralSystemEnabled || rs.marketplaceReferralPercent == 0) {
            return 0;
        }
        return (marketplaceFee * rs.marketplaceReferralPercent) / 10000;
    }

    /**
     * @notice Enable or disable referral system (admin only)
     * @param enabled Whether to enable the referral system
     */
    function setReferralSystemEnabled(bool enabled) external {
        LibDiamond.enforceIsContractOwner();
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        rs.referralSystemEnabled = enabled;
    }

    /**
     * @notice Set referral reward percentages (admin only)
     * @param mintPercent Percentage of mint fee for referrals (basis points, e.g., 500 = 5%)
     * @param marketplacePercent Percentage of marketplace fee for referrals (basis points, e.g., 500 = 5%)
     * @dev Default: 5% for both (500 basis points)
     */
    function setReferralPercentages(uint256 mintPercent, uint256 marketplacePercent) external {
        LibDiamond.enforceIsContractOwner();
        
        // Validate percentages (max 50% = 5000 basis points)
        require(mintPercent <= 5000, "Mint referral percent too high");
        require(marketplacePercent <= 5000, "Marketplace referral percent too high");
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        rs.mintReferralPercent = mintPercent;
        rs.marketplaceReferralPercent = marketplacePercent;
    }

    /**
     * @notice Initialize referral system with default 5% percentages (admin only, one-time setup)
     * @dev Sets default percentages to 5% (500 basis points) for both mint and marketplace
     */
    function initializeReferralSystem() external {
        LibDiamond.enforceIsContractOwner();
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        
        // Only initialize if not already set
        if (rs.mintReferralPercent == 0 && rs.marketplaceReferralPercent == 0) {
            rs.mintReferralPercent = 500; // 5%
            rs.marketplaceReferralPercent = 500; // 5%
            rs.minCodeLength = MIN_CODE_LENGTH;
            rs.maxCodeLength = MAX_CODE_LENGTH;
        }
    }

    /**
     * @notice Set code length limits (admin only)
     * @param minLength Minimum code length (after "ref-" prefix)
     * @param maxLength Maximum code length (after "ref-" prefix)
     */
    function setCodeLengthLimits(uint256 minLength, uint256 maxLength) external {
        LibDiamond.enforceIsContractOwner();
        require(minLength >= 1 && minLength <= 10, "Invalid min length");
        require(maxLength >= minLength && maxLength <= 50, "Invalid max length");
        
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        rs.minCodeLength = minLength;
        rs.maxCodeLength = maxLength;
    }

    /**
     * @notice Helper to check if string starts with prefix
     * @param str String to check
     * @param prefix Prefix to look for
     * @return True if string starts with prefix
     */
    function _startsWith(string memory str, string memory prefix) private pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) {
            return false;
        }
        
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        
        return true;
    }
}

