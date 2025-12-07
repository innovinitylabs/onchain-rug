pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract PricingConstraints is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();
    }

    function test_floorAndCeilingPriceAreUnconstrainedByDefault(uint256 tokenId) public {
        ERC721Mock collectionMock = new ERC721Mock("", "");
        assertEq(paymentProcessor.getFloorPrice(address(collectionMock), tokenId), 0);
        assertEq(paymentProcessor.getCeilingPrice(address(collectionMock), tokenId), type(uint256).max);
    }

    function test_revertsWhenSalePriceBelowFloorNativeCurrency(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(salePrice < floorPrice);

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
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
            "PaymentProcessor__SalePriceBelowMinimumFloor()");
    }

    function test_revertsWhenSalePriceAboveCeilingNativeCurrency(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max);
        vm.assume(salePrice > ceilingPrice);

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
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
            "PaymentProcessor__SalePriceAboveMaximumCeiling()");
    }

    function test_revertsWhenSalePriceBelowFloorERC20Currency(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(salePrice < floorPrice);

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(approvedPaymentCoin));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
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
            "PaymentProcessor__SalePriceBelowMinimumFloor()");
    }

    function test_revertsWhenSalePriceAboveCeilingERC20Currency(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max);
        vm.assume(salePrice > ceilingPrice);

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(approvedPaymentCoin));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
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
            "PaymentProcessor__SalePriceAboveMaximumCeiling()");
    }

    function test_revertsWhenSalePriceWithinPriceConstraintsButCurrencyIsWrong(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max);
        vm.assume(salePrice >= floorPrice && salePrice <= ceilingPrice);

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(approvedPaymentCoin));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
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

    function test_revertsWhenSalePriceWithinPriceConstraintsButCurrencyIsWrong2(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max);
        vm.assume(salePrice >= floorPrice && salePrice <= ceilingPrice);

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(approvedPaymentCoin));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
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
            "PaymentProcessor__NativeCurrencyIsNotAnApprovedPaymentMethod()");
    }

    function test_permitsSalesWhenPriceWithinPriceConstraintsERC20Currency(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max);
        vm.assume(salePrice >= floorPrice && salePrice <= ceilingPrice);

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(approvedPaymentCoin));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false);
    }

    function test_permitsSalesWhenPriceWithinPriceConstraintsNativeCurrency(uint256 floorPrice, uint256 ceilingPrice, uint256 salePrice) public {
        vm.assume(floorPrice <= ceilingPrice);
        vm.assume(ceilingPrice < type(uint256).max);
        vm.assume(salePrice >= floorPrice && salePrice <= ceilingPrice);

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(0));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
            collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
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
            listingMinPrice: salePrice,
            offerPrice: salePrice,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false);
    }

    function test_permitsCollectionSweepsWhenPricesWithinPriceConstraintsNativeCurrency() public {
        uint256 floorPrice = 0.5 ether;
        uint256 ceilingPrice = 2 ether;
        uint256 salePrice = 1 ether;

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(0));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: salePrice * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = salePrice;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: address(0),
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledOfferItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledOfferItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchase(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false);
    }

    function test_revertsOnCollectionSweepsWithWrongCurrency() public {
        uint256 floorPrice = 0.5 ether;
        uint256 ceilingPrice = 2 ether;
        uint256 salePrice = 1 ether;

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(approvedPaymentCoin));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: salePrice * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = salePrice;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: address(0),
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledOfferItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledOfferItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__NativeCurrencyIsNotAnApprovedPaymentMethod()");
    }

    function test_revertsOnCollectionSweepsBelowFloor() public {
        uint256 floorPrice = 0.5 ether;
        uint256 ceilingPrice = 2 ether;
        uint256 salePrice = 0.49 ether;

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(0));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: salePrice * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = salePrice;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: address(0),
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledOfferItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledOfferItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SalePriceBelowMinimumFloor()");
    }

    function test_revertsOnCollectionSweepsAboveCeiling() public {
        uint256 floorPrice = 0.5 ether;
        uint256 ceilingPrice = 2 ether;
        uint256 salePrice = 2.01 ether;

        paymentProcessor.setCollectionPaymentCoin(address(erc721Mock), address(0));

        PricingBounds memory pricingBounds = PricingBounds({
            isEnabled: true,
            isImmutable: false,
            floorPrice: floorPrice,
            ceilingPrice: ceilingPrice
        });

        paymentProcessor.setCollectionPricingBounds(address(erc721Mock), pricingBounds);

        uint256 lastCreatedPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), lastCreatedPolicyId);

        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: salePrice * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = salePrice;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: address(0),
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledOfferItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledOfferItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SalePriceAboveMaximumCeiling()");
    }
}