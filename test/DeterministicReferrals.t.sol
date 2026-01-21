// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {LibBase62} from "../src/libraries/LibBase62.sol";
import {LibRugStorage} from "../src/libraries/LibRugStorage.sol";
import {RugReferralRegistryFacet} from "../src/facets/RugReferralRegistryFacet.sol";

/**
 * @title DeterministicReferralsTest
 * @notice Comprehensive tests for deterministic referral code system
 */
contract DeterministicReferralsTest is Test {
    using LibBase62 for bytes;

    RugReferralRegistryFacet referralFacet;
    address alice = address(0x1234567890123456789012345678901234567890);
    address bob = address(0x9876543210987654321098765432109876543210);
    address charlie = address(0xabcdefabcdefabcdefabcdefabcdefabcdefabcd);

    function setUp() public {
        // Deploy facet
        referralFacet = new RugReferralRegistryFacet();

        // Initialize storage
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        rs.referralSystemEnabled = true;
        rs.mintReferralPercent = 500; // 5%
        rs.marketplaceReferralPercent = 500; // 5%
    }

    /**
     * @notice Test base62 encoding functionality
     */
    function test_Base62Encoding() public {
        bytes memory data = abi.encodePacked(uint256(12345));
        string memory encoded = LibBase62.encode(data, 8);

        assertTrue(bytes(encoded).length == 8, "Should produce 8-character code");
        assertTrue(LibBase62.isValidBase62(encoded), "Should contain only valid base62 chars");
    }

    /**
     * @notice Test deterministic code generation
     */
    function test_DeterministicCodeGeneration() public {
        string memory code1 = LibBase62.generateReferralCode(alice);
        string memory code2 = LibBase62.generateReferralCode(alice);

        assertEq(code1, code2, "Same wallet should generate same code");

        string memory bobCode = LibBase62.generateReferralCode(bob);
        assertTrue(keccak256(bytes(code1)) != keccak256(bytes(bobCode)), "Different wallets should have different codes");
    }

    /**
     * @notice Test code generation for various wallet addresses
     */
    function test_CodeGenerationForDifferentWallets() public {
        address[] memory wallets = new address[](5);
        wallets[0] = address(0x1000000000000000000000000000000000000000);
        wallets[1] = address(0x2000000000000000000000000000000000000000);
        wallets[2] = address(0x3000000000000000000000000000000000000000);
        wallets[3] = address(0x4000000000000000000000000000000000000000);
        wallets[4] = address(0x5000000000000000000000000000000000000000);

        string[] memory codes = new string[](5);

        for (uint i = 0; i < wallets.length; i++) {
            codes[i] = LibBase62.generateReferralCode(wallets[i]);
            assertEq(bytes(codes[i]).length, 8, "All codes should be 8 characters");

            // Check uniqueness
            for (uint j = 0; j < i; j++) {
                assertTrue(keccak256(bytes(codes[i])) != keccak256(bytes(codes[j])), "All codes should be unique");
            }
        }
    }

    /**
     * @notice Test referral registration
     */
    function test_ReferralRegistration() public {
        vm.prank(alice);
        referralFacet.registerForReferrals();

        // Check registration status
        bool isRegistered = referralFacet.isRegistered(alice);
        assertTrue(isRegistered, "Alice should be registered");

        // Check code generation
        string memory code = referralFacet.getReferralCode(alice);
        assertTrue(bytes(code).length > 0, "Should have a referral code");

        // Check code is valid base62 (no prefix)
        assertTrue(LibBase62.isValidBase62(code), "Code should be valid base62");

        // Check code is registered
        assertTrue(referralFacet.codeExists(code), "Code should exist in registry");
    }

    /**
     * @notice Test deterministic code consistency
     */
    function test_DeterministicCodeConsistency() public {
        // Generate code directly
        string memory directCode = LibBase62.generateReferralCode(alice);
        string memory fullDirectCode = directCode;

        // Register and get code
        vm.prank(alice);
        referralFacet.registerForReferrals();
        string memory registeredCode = referralFacet.getReferralCode(alice);

        assertEq(fullDirectCode, registeredCode, "Direct generation should match registered code");
    }

    /**
     * @notice Test one wallet, one registration limit
     */
    function test_OneWalletOneRegistration() public {
        vm.prank(alice);
        referralFacet.registerForReferrals();

        // Try to register again - should revert
        vm.expectRevert("AlreadyRegistered");
        vm.prank(alice);
        referralFacet.registerForReferrals();
    }

    /**
     * @notice Test referral system disabled
     */
    function test_ReferralSystemDisabled() public {
        // Disable referral system
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        rs.referralSystemEnabled = false;

        vm.expectRevert("ReferralSystemDisabled");
        vm.prank(alice);
        referralFacet.registerForReferrals();
    }

    /**
     * @notice Test self-referral prevention in attribution
     */
    function test_SelfReferralPrevention() public {
        // Register Alice
        vm.prank(alice);
        referralFacet.registerForReferrals();

        string memory aliceCode = referralFacet.getReferralCode(alice);

        // Create mock transaction data
        bytes memory mockData = abi.encodeWithSignature("mintRug()", "");

        // Alice tries to refer herself
        string[] memory codes = new string[](1);
        codes[0] = aliceCode;

        address referrer = referralFacet.extractReferrerFromCodes(codes, alice);
        assertEq(referrer, address(0), "Self-referral should return zero address");
    }

    /**
     * @notice Test valid referral attribution
     */
    function test_ValidReferralAttribution() public {
        // Register Alice
        vm.prank(alice);
        referralFacet.registerForReferrals();

        string memory aliceCode = referralFacet.getReferralCode(alice);

        // Bob uses Alice's referral
        string[] memory codes = new string[](1);
        codes[0] = aliceCode;

        address referrer = referralFacet.extractReferrerFromCodes(codes, bob);
        assertEq(referrer, alice, "Should extract Alice as referrer");
    }

    /**
     * @notice Test multiple attribution codes
     */
    function test_MultipleAttributionCodes() public {
        // Register both Alice and Bob
        vm.prank(alice);
        referralFacet.registerForReferrals();
        vm.prank(bob);
        referralFacet.registerForReferrals();

        string memory aliceCode = referralFacet.getReferralCode(alice);
        string memory bobCode = referralFacet.getReferralCode(bob);

        // Codes array with builder code, aggregator, and referral
        string[] memory codes = new string[](3);
        codes[0] = "onchainrugs"; // builder
        codes[1] = aliceCode;     // referral
        codes[2] = "blur";        // aggregator

        address referrer = referralFacet.extractReferrerFromCodes(codes, charlie);
        assertEq(referrer, alice, "Should extract first valid referral code");
    }

    /**
     * @notice Test invalid code handling
     */
    function test_InvalidCodeHandling() public {
        string[] memory codes = new string[](2);
        codes[0] = "invalid@code"; // Contains invalid character for base62
        codes[1] = "onchainrugs";

        address referrer = referralFacet.extractReferrerFromCodes(codes, alice);
        assertEq(referrer, address(0), "Invalid codes should return zero address");
    }

    /**
     * @notice Test code collision detection
     */
    function test_CodeCollisionDetection() public {
        // This test ensures our deterministic generation doesn't create collisions
        // by testing many wallet addresses

        uint256 testCount = 100;
        string[] memory codes = new string[](testCount);

        for (uint256 i = 0; i < testCount; i++) {
            address testWallet = address(uint160(uint256(keccak256(abi.encode(i)))));
            codes[i] = LibBase62.generateReferralCode(testWallet);

            // Check for collisions with previous codes
            for (uint256 j = 0; j < i; j++) {
                assertTrue(keccak256(bytes(codes[i])) != keccak256(bytes(codes[j])), "No collisions should occur");
            }
        }
    }

    /**
     * @notice Test gas usage for registration
     */
    function test_RegistrationGasUsage() public {
        vm.prank(alice);

        uint256 gasBefore = gasleft();
        referralFacet.registerForReferrals();
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Registration gas used:", gasUsed);
        assertTrue(gasUsed < 100000, "Registration should use reasonable gas");
    }

    /**
     * @notice Test referral statistics tracking
     */
    function test_ReferralStatistics() public {
        // Register Alice
        vm.prank(alice);
        referralFacet.registerForReferrals();

        // Initially should have zero stats
        (uint256 totalReferrals, uint256 totalEarned, uint256 lastReferralTime) = referralFacet.getReferralStats(alice);
        assertEq(totalReferrals, 0, "Should start with zero referrals");
        assertEq(totalEarned, 0, "Should start with zero earnings");
    }

    /**
     * @notice Test edge cases
     */
    function test_EdgeCases() public {
        // Test with zero address
        string memory zeroCode = LibBase62.generateReferralCode(address(0));
        assertTrue(bytes(zeroCode).length == 8, "Zero address should generate valid code");

        // Test with max address
        string memory maxCode = LibBase62.generateReferralCode(address(type(uint160).max));
        assertTrue(bytes(maxCode).length == 8, "Max address should generate valid code");

        // Test empty codes array
        string[] memory emptyCodes = new string[](0);
        address referrer = referralFacet.extractReferrerFromCodes(emptyCodes, alice);
        assertEq(referrer, address(0), "Empty codes should return zero address");
    }

    /**
     * @notice Helper function for string prefix checking
     */
    function _startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);

        if (strBytes.length < prefixBytes.length) {
            return false;
        }

        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }

        return true;
    }
}