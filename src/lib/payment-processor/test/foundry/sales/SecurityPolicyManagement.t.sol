pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract SecurityPolicyManagement is PaymentProcessorSaleScenarioBase {

    // Profile 7
    uint256 internal SECURITY_POLICY_TO_UPDATE;

    function setUp() public override {
        super.setUp();

        SECURITY_POLICY_TO_UPDATE = paymentProcessor.createSecurityPolicy(
            true, 
            true, 
            true,
            true, 
            true, 
            true, 
            true, 
            2300, 
            "UPDATE ME");
    }

    function test_createSecurityPolicy(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName) public {

        vm.assume(policyAdmin != address(0));

        vm.prank(policyAdmin);
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit, 
            registryName);

        SecurityPolicy memory securityPolicy = paymentProcessor.getSecurityPolicy(securityPolicyId);
        
        assertEq(enforceExchangeWhitelist, securityPolicy.enforceExchangeWhitelist);
        assertEq(enforcePaymentMethodWhitelist, securityPolicy.enforcePaymentMethodWhitelist);
        assertEq(enforcePricingConstraints, securityPolicy.enforcePricingConstraints);
        assertEq(disablePrivateListings, securityPolicy.disablePrivateListings);
        assertEq(disableDelegatedPurchases, securityPolicy.disableDelegatedPurchases);
        assertEq(disableEIP1271Signatures, securityPolicy.disableEIP1271Signatures);
        assertEq(disableExchangeWhitelistEOABypass, securityPolicy.disableExchangeWhitelistEOABypass);
        assertEq(pushPaymentGasLimit, securityPolicy.pushPaymentGasLimit);
        assertEq(policyAdmin, securityPolicy.policyOwner);
    }

    function test_updateSecurityPolicy(
        address policyAdmin,
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit) public {

        vm.assume(policyAdmin != address(0));

        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, policyAdmin);
        
        vm.prank(policyAdmin);
        paymentProcessor.updateSecurityPolicy(
            SECURITY_POLICY_TO_UPDATE,
            enforceExchangeWhitelist, 
            enforcePaymentMethodWhitelist, 
            enforcePricingConstraints,
            disablePrivateListings, 
            disableDelegatedPurchases, 
            disableEIP1271Signatures, 
            disableExchangeWhitelistEOABypass, 
            pushPaymentGasLimit,
            "");

        SecurityPolicy memory securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        
        assertEq(enforceExchangeWhitelist, securityPolicy.enforceExchangeWhitelist);
        assertEq(enforcePaymentMethodWhitelist, securityPolicy.enforcePaymentMethodWhitelist);
        assertEq(enforcePricingConstraints, securityPolicy.enforcePricingConstraints);
        assertEq(disablePrivateListings, securityPolicy.disablePrivateListings);
        assertEq(disableDelegatedPurchases, securityPolicy.disableDelegatedPurchases);
        assertEq(disableEIP1271Signatures, securityPolicy.disableEIP1271Signatures);
        assertEq(disableExchangeWhitelistEOABypass, securityPolicy.disableExchangeWhitelistEOABypass);
        assertEq(pushPaymentGasLimit, securityPolicy.pushPaymentGasLimit);
        assertEq(policyAdmin, securityPolicy.policyOwner);
    }

    function test_revertsWhenTransferringOwnershipToZeroAddress(address policyAdmin) public {
        vm.assume(policyAdmin != address(0));

        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, policyAdmin);
        
        vm.prank(policyAdmin);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__SecurityPolicyOwnershipCannotBeTransferredToZeroAddress()"))));
        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, address(0));
    }

    function test_transferSecurityPolicyOwnership(address policyAdmin1, address policyAdmin2) public {

        vm.assume(policyAdmin1 != address(0));
        vm.assume(policyAdmin2 != address(0));

        SecurityPolicy memory securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        
        assertEq(securityPolicy.policyOwner, address(this));

        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, policyAdmin1);
        securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        assertEq(securityPolicy.policyOwner, policyAdmin1);

        vm.prank(policyAdmin1);
        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, policyAdmin2);
        securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        assertEq(securityPolicy.policyOwner, policyAdmin2);
    }

    function test_renounceSecurityPolicyOwnership(address policyAdmin1) public {

        vm.assume(policyAdmin1 != address(0));

        SecurityPolicy memory securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        
        assertEq(securityPolicy.policyOwner, address(this));

        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, policyAdmin1);
        securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        assertEq(securityPolicy.policyOwner, policyAdmin1);

        vm.prank(policyAdmin1);
        paymentProcessor.renounceSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE);
        securityPolicy = paymentProcessor.getSecurityPolicy(SECURITY_POLICY_TO_UPDATE);
        assertEq(securityPolicy.policyOwner, address(0));
    }

    function test_revertsWhenNonPolicyOwnerAttemptsToRenouncePolicy(address policyAdmin1, address unauthorizedUser) public {

        vm.assume(policyAdmin1 != address(0));
        vm.assume(unauthorizedUser != address(0));
        vm.assume(policyAdmin1 !=unauthorizedUser);

        paymentProcessor.transferSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE, policyAdmin1);

        vm.prank(unauthorizedUser);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerDoesNotOwnSecurityPolicy()"))));
        paymentProcessor.renounceSecurityPolicyOwnership(SECURITY_POLICY_TO_UPDATE);
    }

    function test_revertsWhenCollectionSecurityPolicyIsCalledByContractThatDoesNotOwnTokenContract(address collectionOwner, address account, uint256 securityPolicyId) public {
        vm.assume(securityPolicyId < 7);
        vm.assume(collectionOwner != address(0));
        vm.assume(account != address(0));
        vm.assume(collectionOwner != account);

        vm.prank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");

        vm.prank(account);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerMustHaveElevatedPermissionsForSpecifiedNFT()"))));
        paymentProcessor.setCollectionSecurityPolicy(address(collection), securityPolicyId);
    }

    function test_collectionSecurityPolicyCanBeSetByCollectionOwner(address collectionOwner, uint256 securityPolicyId) public {
        vm.assume(securityPolicyId < 7);
        vm.assume(collectionOwner != address(0));

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setCollectionSecurityPolicy(address(collection), securityPolicyId);
        vm.stopPrank();

        assertEq(paymentProcessor.getTokenSecurityPolicyId(address(collection)), securityPolicyId);
    }

    function test_revertsWhenSetSecurityPolicyIsCalledWithNonExistentPolicyId() public {
        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            false, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        vm.expectRevert(PaymentProcessor.PaymentProcessor__SecurityPolicyDoesNotExist.selector);
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId + 1);
    }

    function test_revertsWhenSetCollectionPaymentCoinIsCalledByUnprivilegedAccount(address collectionOwner, address account) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(account != address(0));
        vm.assume(collectionOwner != account);

        ERC20Mock coin = new ERC20Mock(18);

        vm.prank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");

        vm.prank(account);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerMustHaveElevatedPermissionsForSpecifiedNFT()"))));
        paymentProcessor.setCollectionPaymentCoin(address(collection), address(coin));
    }

    function test_revertsWhenSetCollectionPricingBoundsIsCalledByUnprivilegedAccount(
        address collectionOwner, 
        address account, 
        bool isImmutable, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(account != address(0));
        vm.assume(collectionOwner != account);
        vm.assume(floorPrice <= ceilingPrice);

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: isImmutable,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        vm.prank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");

        if(account == address(collection)) {
            collection = new ERC721Mock("", "");
        }

        vm.prank(account);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerMustHaveElevatedPermissionsForSpecifiedNFT()"))));
        paymentProcessor.setCollectionPricingBounds(address(collection), pricingBounds);
    }

    function test_revertsWhenSetTokenPricingBoundsIsCalledByUnprivilegedAccount(
        address collectionOwner, 
        address account, 
        bool isImmutable, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(account != address(0));
        vm.assume(collectionOwner != account);
        vm.assume(floorPrice <= ceilingPrice);

        uint256[] memory tokenIds = new uint256[](10);
        PricingBounds[] memory tokenPricingBounds = new PricingBounds[](10);

        for (uint256 i = 0; i < tokenPricingBounds.length; ++i) {
            tokenIds[i] = i;

            tokenPricingBounds[i] = PricingBounds({
                isEnabled: true,
                isImmutable: isImmutable,
                floorPrice: floorPrice,
                ceilingPrice: ceilingPrice
            });
        }

        vm.prank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");

        if(account == address(collection)) {
            collection = new ERC721Mock("", "");
        }

        vm.prank(account);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerMustHaveElevatedPermissionsForSpecifiedNFT()"))));
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
    }

    function test_collectionPaymentCoinCanBeSetToNativeCurrencyByCollectionOwner(address collectionOwner) public {
        vm.assume(collectionOwner != address(0));

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setCollectionPaymentCoin(address(collection), address(0));
        vm.stopPrank();

        assertEq(paymentProcessor.collectionPaymentCoins(address(collection)), address(0));
    }

    function test_collectionPaymentCoinCanBeSetToERC20CoinsByCollectionOwner(address collectionOwner) public {
        vm.assume(collectionOwner != address(0));

        ERC20Mock coin = new ERC20Mock(18);

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setCollectionPaymentCoin(address(collection), address(coin));
        vm.stopPrank();

        assertEq(paymentProcessor.collectionPaymentCoins(address(collection)), address(coin));
    }

    function test_collectionPricingBoundsCanBeSetByCollectionOwner(
        address collectionOwner, 
        bool isImmutable, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice <= ceilingPrice);

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: isImmutable,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setCollectionPricingBounds(address(collection), pricingBounds);
        vm.stopPrank();

        assertEq(paymentProcessor.isCollectionPricingImmutable(address(collection)), isImmutable);
        assertEq(paymentProcessor.getFloorPrice(address(collection), 0), floorPrice);
        assertEq(paymentProcessor.getCeilingPrice(address(collection), 0), ceilingPrice);
    }

    function test_revertsWhenCollectionPricingBoundsSetWithFloorPriceAboveCeiling(
        address collectionOwner, 
        bool isImmutable, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice > ceilingPrice);

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: isImmutable,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        vm.expectRevert(PaymentProcessor.PaymentProcessor__CeilingPriceMustBeGreaterThanFloorPrice.selector);
        paymentProcessor.setCollectionPricingBounds(address(collection), pricingBounds);
        vm.stopPrank();
    }

    function test_revertsWhenCollectionPricingBoundsSetAfterPreviouslySettingItAsImmutable(
        address collectionOwner, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice <= ceilingPrice);

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: true,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setCollectionPricingBounds(address(collection), pricingBounds);
        vm.expectRevert(PaymentProcessor.PaymentProcessor__PricingBoundsAreImmutable.selector);
        paymentProcessor.setCollectionPricingBounds(address(collection), pricingBounds);
        vm.stopPrank();
    }

    function test_tokenPricingBoundsCanBeSetByCollectionOwner(
        address collectionOwner, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max - 10);

        uint256[] memory tokenIds = new uint256[](10);
        PricingBounds[] memory tokenPricingBounds = new PricingBounds[](10);

        for (uint256 i = 0; i < 10; ++i) {
            tokenIds[i] = i;
            tokenPricingBounds[i] = PricingBounds({
                isEnabled: true,
                isImmutable: i % 2 == 0,
                floorPrice: floorPrice + i,
                ceilingPrice: ceilingPrice + i
            });

        }

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
        vm.stopPrank();

        for (uint256 i = 0; i < 10; ++i) {
            assertEq(paymentProcessor.isTokenPricingImmutable(address(collection), i), i % 2 == 0);
            assertEq(paymentProcessor.getFloorPrice(address(collection), i), floorPrice + i);
            assertEq(paymentProcessor.getCeilingPrice(address(collection), i), ceilingPrice + i);
        }
    }

    function test_revertsWhenTokenPricingBoundsSetWithFloorAboveCeiling(
        address collectionOwner, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice > ceilingPrice);
        vm.assume(floorPrice < type(uint256).max - 10);

        uint256[] memory tokenIds = new uint256[](10);
        PricingBounds[] memory tokenPricingBounds = new PricingBounds[](10);

        for (uint256 i = 0; i < 10; ++i) {
            tokenIds[i] = i;
            tokenPricingBounds[i] = PricingBounds({
                isEnabled: true,
                isImmutable: i % 2 == 0,
                floorPrice: floorPrice + i,
                ceilingPrice: ceilingPrice + i
            });

        }

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        vm.expectRevert(PaymentProcessor.PaymentProcessor__CeilingPriceMustBeGreaterThanFloorPrice.selector);
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
        vm.stopPrank();
    }

    function test_revertsWhenTokenPricingBoundsSetAfterPreviouslySettingThemAsImmutable(
        address collectionOwner, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max - 10);

        uint256[] memory tokenIds = new uint256[](10);
        PricingBounds[] memory tokenPricingBounds = new PricingBounds[](10);

        for (uint256 i = 0; i < 10; ++i) {
            tokenIds[i] = i;
            tokenPricingBounds[i] = PricingBounds({
                isEnabled: true,
                isImmutable: i % 2 == 0,
                floorPrice: floorPrice + i,
                ceilingPrice: ceilingPrice + i
            });

        }

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
        vm.expectRevert(PaymentProcessor.PaymentProcessor__PricingBoundsAreImmutable.selector);
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
        vm.stopPrank();
    }

    function test_revertsWhenTokenPricingBoundsSetWithMismatchedArrayLengths(
        address collectionOwner, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max - 10);

        uint256[] memory tokenIds = new uint256[](9);
        PricingBounds[] memory tokenPricingBounds = new PricingBounds[](10);

        for (uint256 i = 0; i < 9; ++i) {
            tokenIds[i] = i;
            tokenPricingBounds[i] = PricingBounds({
                isEnabled: true,
                isImmutable: i % 2 == 0,
                floorPrice: floorPrice + i,
                ceilingPrice: ceilingPrice + i
            });

        }

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        vm.expectRevert(PaymentProcessor.PaymentProcessor__InputArrayLengthMismatch.selector);
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
        vm.stopPrank();
    }

    function test_revertsWhenTokenPricingBoundsSetWithEmptyArrays(
        address collectionOwner, 
        uint256 floorPrice, 
        uint256 ceilingPrice) public {
        vm.assume(collectionOwner != address(0));
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max - 10);

        uint256[] memory tokenIds = new uint256[](0);
        PricingBounds[] memory tokenPricingBounds = new PricingBounds[](0);

        vm.startPrank(collectionOwner);
        ERC721Mock collection = new ERC721Mock("", "");
        vm.expectRevert(PaymentProcessor.PaymentProcessor__InputArrayLengthCannotBeZero.selector);
        paymentProcessor.setTokenPricingBounds(address(collection), tokenIds, tokenPricingBounds);
        vm.stopPrank();
    }
}