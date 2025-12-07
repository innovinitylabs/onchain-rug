pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract CoinApprovals is PaymentProcessorSaleScenarioBase {

    function test_revertsWhenApprovingCoinsForDefaultSecurityPolicy(address coin) public {
        vm.assume(coin != address(0));
        vm.assume(coin != address(approvedPaymentCoin));
        vm.assume(coin != address(unapprovedPaymentCoin));
        uint256 defaultSecurityPolicyId = paymentProcessor.DEFAULT_SECURITY_POLICY_ID();
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerDoesNotOwnSecurityPolicy()"))));
        paymentProcessor.whitelistPaymentMethod(defaultSecurityPolicyId, coin);
        assertFalse(paymentProcessor.isPaymentMethodApproved(defaultSecurityPolicyId, coin));
    }

    function test_securityPolicyCreatorCanApproveCoins(
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

        address[] memory coins = new address[](3);
        coins[0] = address(new ERC20Mock(18));
        coins[1] = address(new ERC20Mock(18));
        coins[2] = address(new ERC20Mock(18));

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
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

        for(uint256 i = 0; i < coins.length; ++i) {
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, coins[i]);
            assertTrue(paymentProcessor.isPaymentMethodApproved(securityPolicyId, coins[i]));
        }

        vm.stopPrank();
    }

    function test_revertsWhenSecurityPolicyCreatorApprovesCoinsThatAreAlreadyWhitelisted(
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

        address[] memory coins = new address[](3);
        coins[0] = address(new ERC20Mock(18));
        coins[1] = address(new ERC20Mock(18));
        coins[2] = address(new ERC20Mock(18));

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
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

        for(uint256 i = 0; i < coins.length; ++i) {
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, coins[i]);
            assertTrue(paymentProcessor.isPaymentMethodApproved(securityPolicyId, coins[i]));

            vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CoinIsApproved()"))));
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, coins[i]);
        }

        vm.stopPrank();
    }

    function test_revertsWhenDisapprovingCoinForDefaultSecurityPolicy(address coin) public {
        vm.assume(coin != address(0));
        vm.assume(coin != address(approvedPaymentCoin));
        vm.assume(coin != address(unapprovedPaymentCoin));
        uint256 defaultSecurityPolicyId = paymentProcessor.DEFAULT_SECURITY_POLICY_ID();
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerDoesNotOwnSecurityPolicy()"))));
        paymentProcessor.unwhitelistPaymentMethod(defaultSecurityPolicyId, coin);
        assertFalse(paymentProcessor.isPaymentMethodApproved(defaultSecurityPolicyId, coin));
    }

    function test_revertsWhenSecurityPolicyCreatorDisapprovesCoinsThatAreNotApproved(
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

        address[] memory coins = new address[](3);
        coins[0] = address(0x5eadbeef);
        coins[1] = address(0x6eadbeef);
        coins[2] = address(0x7eadbeef);

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
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

        for(uint256 i = 0; i < coins.length; ++i) {
            vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CoinIsNotApproved()"))));
            paymentProcessor.unwhitelistPaymentMethod(securityPolicyId, coins[i]);
        }

        vm.stopPrank();
    }

    function test_securityPolicyCreatorCanDisapproveCoins(
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

        address[] memory coins = new address[](3);
        coins[0] = address(new ERC20Mock(18));
        coins[1] = address(new ERC20Mock(18));
        coins[2] = address(new ERC20Mock(18));

        vm.assume(policyAdmin != address(0));

        vm.startPrank(policyAdmin);
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

        for(uint256 i = 0; i < coins.length; ++i) {
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, coins[i]);
            assertTrue(paymentProcessor.isPaymentMethodApproved(securityPolicyId, coins[i]));

            paymentProcessor.unwhitelistPaymentMethod(securityPolicyId, coins[i]);
            assertFalse(paymentProcessor.isPaymentMethodApproved(securityPolicyId, coins[i]));
        }

        vm.stopPrank();
    }

    function test_revertsWhenSaleIsAttemptedWithUnapprovedPaymentMethod() public {
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            true, 
            false,
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), securityPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(unapprovedPaymentCoin),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            maxRoyaltyFeeNumerator: 0,
            listingNonce: _getNextNonce(sellerEOA),
            offerNonce: _getNextNonce(buyerEOA),
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__PaymentCoinIsNotAnApprovedPaymentMethod()");
    }
}