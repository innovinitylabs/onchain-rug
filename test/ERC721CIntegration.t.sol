// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugTransferSecurityFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import {TransferSecurityLevels} from "@limitbreak/creator-token-contracts/utils/TransferPolicy.sol";
import {ICreatorToken} from "@limitbreak/creator-token-contracts/interfaces/ICreatorToken.sol";

/**
 * @title ERC721C Integration Test
 * @notice Tests ERC721-C integration and transfer validation
 */
contract ERC721CIntegrationTest is Test {
    
    Diamond public diamond;
    DiamondCutFacet public diamondCutFacet;
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugTransferSecurityFacet public rugTransferSecurityFacet;
    RugCommerceFacet public rugCommerceFacet;

    address public owner;
    address public user1;
    address public user2;
    address public marketplace;

    // Default transfer validator address (LimitBreak)
    address constant DEFAULT_VALIDATOR = 0x0000721C310194CcfC01E523fc93C9cCcFa2A0Ac;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        marketplace = address(0x3);

        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);

        // Deploy diamond infrastructure
        diamondCutFacet = new DiamondCutFacet();
        diamond = new Diamond(owner, address(diamondCutFacet));

        // Deploy facets
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugTransferSecurityFacet = new RugTransferSecurityFacet();
        rugCommerceFacet = new RugCommerceFacet();

        // Configure diamond with facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](4);
        
        // NFT Facet
        bytes4[] memory nftSelectors = new bytes4[](5);
        nftSelectors[0] = RugNFTFacet.mintRug.selector;
        nftSelectors[1] = bytes4(keccak256("ownerOf(uint256)"));
        nftSelectors[2] = bytes4(keccak256("transferFrom(address,address,uint256)"));
        nftSelectors[3] = RugNFTFacet.getTransferValidator.selector;
        nftSelectors[4] = RugNFTFacet.supportsInterface.selector;
        
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: nftSelectors
        });

        // Admin Facet
        bytes4[] memory adminSelectors = new bytes4[](1);
        adminSelectors[0] = RugAdminFacet.updateCollectionCap.selector;
        
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: adminSelectors
        });

        // Transfer Security Facet
        bytes4[] memory securitySelectors = new bytes4[](6);
        securitySelectors[0] = RugTransferSecurityFacet.initializeTransferSecurity.selector;
        securitySelectors[1] = RugTransferSecurityFacet.setToDefaultSecurityPolicy.selector;
        securitySelectors[2] = RugTransferSecurityFacet.getTransferValidator.selector;
        securitySelectors[3] = RugTransferSecurityFacet.areTransfersEnforced.selector;
        securitySelectors[4] = RugTransferSecurityFacet.setTransferEnforcement.selector;
        securitySelectors[5] = RugTransferSecurityFacet.isSecurityInitialized.selector;
        
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(rugTransferSecurityFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: securitySelectors
        });

        // Commerce Facet
        bytes4[] memory commerceSelectors = new bytes4[](2);
        commerceSelectors[0] = RugCommerceFacet.royaltyInfo.selector;
        commerceSelectors[1] = RugCommerceFacet.configureRoyalties.selector;
        
        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: commerceSelectors
        });

        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");

        // Initialize transfer security
        RugTransferSecurityFacet(address(diamond)).initializeTransferSecurity();
    }

    function test_TransferSecurityInitialization() public {
        assertTrue(RugTransferSecurityFacet(address(diamond)).isSecurityInitialized());
        address validator = RugTransferSecurityFacet(address(diamond)).getTransferValidator();
        assertEq(validator, DEFAULT_VALIDATOR);
        assertTrue(RugTransferSecurityFacet(address(diamond)).areTransfersEnforced());
    }

    function test_SupportsICreatorToken() public {
        bytes4 creatorTokenInterface = type(ICreatorToken).interfaceId;
        assertTrue(RugNFTFacet(address(diamond)).supportsInterface(creatorTokenInterface));
    }

    function test_GetTransferValidator() public {
        ICreatorTokenTransferValidator validator = RugNFTFacet(address(diamond)).getTransferValidator();
        assertEq(address(validator), DEFAULT_VALIDATOR);
    }

    function test_CanDisableTransferEnforcement() public {
        // Disable transfer enforcement
        RugTransferSecurityFacet(address(diamond)).setTransferEnforcement(false);
        assertFalse(RugTransferSecurityFacet(address(diamond)).areTransfersEnforced());

        // Re-enable
        RugTransferSecurityFacet(address(diamond)).setTransferEnforcement(true);
        assertTrue(RugTransferSecurityFacet(address(diamond)).areTransfersEnforced());
    }

    function test_RoyaltyInfoIntegration() public {
        // Configure royalties
        address[] memory recipients = new address[](1);
        recipients[0] = owner;
        
        uint256[] memory splits = new uint256[](1);
        splits[0] = 500; // 5%
        
        RugCommerceFacet(address(diamond)).configureRoyalties(500, recipients, splits);

        // Check royalty info
        (address receiver, uint256 royaltyAmount) = RugCommerceFacet(address(diamond)).royaltyInfo(1, 1 ether);
        assertEq(receiver, owner);
        assertEq(royaltyAmount, 0.05 ether);
    }

    function test_MultipleTransfersWithEnforcement() public {
        // For this test, we'd need to mock the validator or deploy a real one
        // This is a placeholder for integration testing
        // In production, you would:
        // 1. Deploy the actual CreatorTokenTransferValidator
        // 2. Configure whitelists and security levels
        // 3. Test transfers through the validator
        
        // Disable enforcement for now since we don't have a real validator deployed
        RugTransferSecurityFacet(address(diamond)).setTransferEnforcement(false);
        
        // Note: Actual transfer tests would require:
        // - Minting a token
        // - Attempting transfers with various security configurations
        // - Verifying validation logic
    }

    function test_SecurityPolicyManagement() public {
        // Test setting default policy
        RugTransferSecurityFacet(address(diamond)).setToDefaultSecurityPolicy();
        
        // Verify validator is still set
        address validator = RugTransferSecurityFacet(address(diamond)).getTransferValidator();
        assertEq(validator, DEFAULT_VALIDATOR);
    }

    function test_RevertOnDoubleInitialization() public {
        vm.expectRevert();
        RugTransferSecurityFacet(address(diamond)).initializeTransferSecurity();
    }

    function test_OnlyOwnerCanConfigureSecurity() public {
        vm.prank(user1);
        vm.expectRevert();
        RugTransferSecurityFacet(address(diamond)).setTransferEnforcement(false);
    }

    function test_PaymentProcessorPricingBounds() public {
        // Set collection pricing bounds
        RugCommerceFacet(address(diamond)).setCollectionPricingBounds(
            0.01 ether,  // floor
            1 ether,     // ceiling
            false        // not immutable
        );

        (uint256 floor, uint256 ceiling) = RugCommerceFacet(address(diamond)).getCollectionPricingBounds();
        assertEq(floor, 0.01 ether);
        assertEq(ceiling, 1 ether);
        assertFalse(RugCommerceFacet(address(diamond)).isCollectionPricingImmutable());
    }

    function test_PaymentProcessorTokenPricingBounds() public {
        uint256 tokenId = 1;
        
        // Set token pricing bounds
        RugCommerceFacet(address(diamond)).setTokenPricingBounds(
            tokenId,
            0.05 ether,  // floor
            0.5 ether,   // ceiling
            true         // immutable
        );

        (uint256 floor, uint256 ceiling) = RugCommerceFacet(address(diamond)).getTokenPricingBounds(tokenId);
        assertEq(floor, 0.05 ether);
        assertEq(ceiling, 0.5 ether);
        assertTrue(RugCommerceFacet(address(diamond)).isTokenPricingImmutable(tokenId));
    }

    function test_CannotChangeImmutablePricing() public {
        uint256 tokenId = 1;
        
        // Set immutable bounds
        RugCommerceFacet(address(diamond)).setTokenPricingBounds(
            tokenId,
            0.05 ether,
            0.5 ether,
            true
        );

        // Try to change - should revert
        vm.expectRevert("Bounds are immutable");
        RugCommerceFacet(address(diamond)).setTokenPricingBounds(
            tokenId,
            0.1 ether,
            1 ether,
            false
        );
    }

    function test_ApprovedPaymentCoin() public {
        address usdc = address(0x123);
        
        RugCommerceFacet(address(diamond)).setApprovedPaymentCoin(usdc);
        assertEq(RugCommerceFacet(address(diamond)).getApprovedPaymentCoin(), usdc);
    }
}

