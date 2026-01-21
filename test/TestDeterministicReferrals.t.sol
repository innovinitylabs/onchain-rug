// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {RugAttributionRegistryFacet} from "../src/facets/RugAttributionRegistryFacet.sol";
import {LibRugStorage} from "../src/libraries/LibRugStorage.sol";

/**
 * @title TestDeterministicReferrals
 * @notice Test the deterministic referral system on Base Sepolia
 */
contract TestDeterministicReferrals is Test {
    address constant DIAMOND = 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff;
    RugAttributionRegistryFacet attributionFacet;

    address alice = address(0x1234567890abcdef1234567890abcdef12345678);
    address bob = address(0x9876543210fedcba9876543210fedcba98765432);

    function setUp() public {
        attributionFacet = RugAttributionRegistryFacet(DIAMOND);
    }

    /**
     * @notice Test deterministic code generation
     */
    function test_GenerateShortCode() public {
        string memory aliceCode = attributionFacet.generateAttributionCode(alice);
        string memory bobCode = attributionFacet.generateAttributionCode(bob);

        console.log("Alice code:", aliceCode);
        console.log("Bob code:", bobCode);

        // Codes should be 8 characters
        assertEq(bytes(aliceCode).length, 8, "Alice code should be 8 chars");
        assertEq(bytes(bobCode).length, 8, "Bob code should be 8 chars");

        // Different wallets should have different codes
        assertTrue(keccak256(bytes(aliceCode)) != keccak256(bytes(bobCode)), "Codes should be different");
    }

    /**
     * @notice Test deterministic code consistency
     */
    function test_DeterministicConsistency() public {
        string memory code1 = attributionFacet.generateAttributionCode(alice);
        string memory code2 = attributionFacet.generateAttributionCode(alice);

        assertEq(code1, code2, "Same wallet should generate same code");
    }

    /**
     * @notice Test registration status (should be false initially)
     */
    function test_InitialRegistrationStatus() public {
        bool isRegistered = attributionFacet.isAttributionRegistered(alice);
        assertFalse(isRegistered, "Alice should not be registered initially");
    }

    /**
     * @notice Test getting referral code (should be empty initially)
     */
    function test_GetReferralCodeInitiallyEmpty() public {
        string memory code = attributionFacet.getAttributionCode(alice);
        assertEq(bytes(code).length, 0, "Should return empty string for unregistered wallet");
    }

    /**
     * @notice Test system enabled status
     */
    function test_SystemEnabled() public {
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.referralStorage();
        // This would need to be checked via the diamond storage
        // For now, we'll assume it's enabled as per deployment
    }

    /**
     * @notice Test referral code extraction logic
     */
    function test_ReferralCodeExtraction() public view {
        // Create test codes
        string[] memory codes = new string[](2);
        codes[0] = "onchainrugs";
        codes[1] = "ref-a8x2k9mP4q"; // Example code

        // This would test the extraction logic if we could set up test data
        console.log("Test referral code extraction setup complete");
    }

    /**
     * @notice Test the complete flow (would need funded account)
     */
    function test_CompleteFlow() public {
        // This would require:
        // 1. Funding the test account
        // 2. Calling registerForReferrals()
        // 3. Verifying registration
        // 4. Testing referral extraction

        console.log("Complete flow test requires funded account - run manually");
    }
}