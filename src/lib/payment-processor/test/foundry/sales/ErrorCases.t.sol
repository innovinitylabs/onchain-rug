pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract ErrorCasesGeneral is PaymentProcessorSaleScenarioBase {
    
    function test_shouldRevertWhenSellerAcceptedItemLevelOfferAndPaymentMethodIsETH() public {
        
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: true,
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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        
        vm.deal(saleDetails.seller, saleDetails.offerPrice);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.prank(saleDetails.seller);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CollectionLevelOrItemLevelOffersCanOnlyBeMadeUsingERC20PaymentMethods()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(
            saleDetails, 
            signedListing, 
            signedOffer);
    }

    function test_shouldRevertWhenSellerAcceptedCollectionLevelOfferAndPaymentMethodIsETH() public {
        
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: true,
            collectionLevelOffer: true,
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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        
        vm.deal(saleDetails.seller, saleDetails.offerPrice);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.prank(saleDetails.seller);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CollectionLevelOrItemLevelOffersCanOnlyBeMadeUsingERC20PaymentMethods()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(
            saleDetails, 
            signedListing, 
            signedOffer);
    }

    function test_shouldRevertWhenListingNonceHasBeenRevoked() public {
        
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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        vm.prank(saleDetails.seller);
        paymentProcessor.revokeSingleNonce(saleDetails.marketplace, saleDetails.listingNonce);

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__SignatureAlreadyUsedOrRevoked()");
    }

    function test_shouldRevertWhenListingNonceHasBeenRevokedForBundledItem() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        paymentProcessor.revokeSingleNonce(bundledOfferDetails.marketplace, bundledOfferItems[bundledOfferItems.length - 1].listingNonce);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SignatureAlreadyUsedOrRevoked()");
    }

    function test_shouldRevertWhenListingNonceHasBeenRevokedForBatchedSaleItems() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
        SignatureECDSA[] memory signedOffers = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            saleDetailsBatch[i] = saleDetails;

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);
            signedOffers[i] = _getSignedOffer(buyerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        paymentProcessor.revokeSingleNonce(bundledOfferDetails.marketplace, bundledOfferItems[bundledOfferItems.length - 1].listingNonce);

        _executeBatchedSaleExpectingRevert(
            bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer,
            saleDetailsBatch,
            signedListings,
            signedOffers,
            false, 
            "PaymentProcessor__SignatureAlreadyUsedOrRevoked()");
    }

    function test_shouldRevertWhenOfferNonceHasBeenRevoked() public {
        
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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        vm.prank(saleDetails.buyer);
        paymentProcessor.revokeSingleNonce(saleDetails.marketplace, saleDetails.offerNonce);

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__SignatureAlreadyUsedOrRevoked()");
    }

    function test_shouldRevertWhenOfferNonceHasBeenRevokedForBundledItem() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(buyerEOA);
        paymentProcessor.revokeSingleNonce(bundledOfferDetails.marketplace, bundledOfferDetails.offerNonce);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SignatureAlreadyUsedOrRevoked()");
    }

    function test_shouldRevertWhenOfferNonceHasBeenRevokedForBatchedSaleItems() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
        SignatureECDSA[] memory signedOffers = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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
                    offerNonce: _getNextNonce(buyerEOA),
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            saleDetailsBatch[i] = saleDetails;

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);
            signedOffers[i] = _getSignedOffer(buyerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(buyerEOA);
        paymentProcessor.revokeSingleNonce(bundledOfferDetails.marketplace, saleDetailsBatch[saleDetailsBatch.length - 1].offerNonce);

        _executeBatchedSaleExpectingRevert(
            bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer,
            saleDetailsBatch,
            signedListings,
            signedOffers,
            false, 
            "PaymentProcessor__SignatureAlreadyUsedOrRevoked()");
    }

    function test_shouldRevertWhenSellerMasterNonceHasBeenRevoked() public {
        
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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.prank(saleDetails.seller);
        paymentProcessor.revokeMasterNonce();

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            signedListing, 
            signedOffer,
            false,
            "PaymentProcessor__SellerDidNotAuthorizeSale()");
    }

    function test_shouldRevertWhenSellerMasterNonceHasBeenRevokedForBundledItem() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        paymentProcessor.revokeMasterNonce();

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SellerDidNotAuthorizeSale()");
    }

    function test_shouldRevertWhenSellerMasterNonceHasBeenRevokedForBatchedSaleItem() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
        SignatureECDSA[] memory signedOffers = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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
                    offerNonce: _getNextNonce(buyerEOA),
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            saleDetailsBatch[i] = saleDetails;

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);
            signedOffers[i] = _getSignedOffer(buyerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        paymentProcessor.revokeMasterNonce();

        _executeBatchedSaleExpectingRevert(
            bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer,
            saleDetailsBatch,
            signedListings,
            signedOffers,
            false, 
            "PaymentProcessor__SellerDidNotAuthorizeSale()");
    }

    function test_shouldRevertWhenBuyerMasterNonceHasBeenRevoked() public {
        
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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.prank(saleDetails.buyer);
        paymentProcessor.revokeMasterNonce();

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            signedListing, 
            signedOffer,
            false,
            "PaymentProcessor__BuyerDidNotAuthorizePurchase()");
    }

    function test_shouldRevertWhenBuyerMasterNonceHasBeenRevokedForBundledItem() public {
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.prank(buyerEOA);
        paymentProcessor.revokeMasterNonce();

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            signedOffer,
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__BuyerDidNotAuthorizePurchase()");
    }

    function test_shouldRevertWhenListingNotSignedBySeller() public {
        
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
            _getSignedListing(buyerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__SellerDidNotAuthorizeSale()");
    }

    function test_shouldRevertWhenBundledItemListingsAreNotSignedByTheSeller(uint256 badSignerKey) public {
        
        vm.assume(badSignerKey > 0 && badSignerKey < type(uint160).max);
        
        address badSigner = vm.addr(badSignerKey);
        vm.assume(badSigner != address(0));
        vm.assume(badSigner != sellerEOA);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            signedListings[i] = _getSignedListing(badSignerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SellerDidNotAuthorizeSale()");
    }

    function test_shouldRevertWhenOfferNotSignedByBuyer() public {
        
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
            _getSignedOffer(sellerKey, saleDetails),
            false,
            "PaymentProcessor__BuyerDidNotAuthorizePurchase()");
    }

    function test_shouldRevertWhenBundledOffersAreNotSignedByTheBuyer(uint256 badSignerKey) public {
        
        vm.assume(badSignerKey > 0 && badSignerKey < type(uint160).max);
        
        address badSigner = vm.addr(badSignerKey);
        vm.assume(badSigner != address(0));
        vm.assume(badSigner != buyerEOA);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(badSignerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__BuyerDidNotAuthorizePurchase()");
    }

    function test_expiredSingleSaleListingShouldFail(uint256 secondsInPast) public {
        vm.assume(secondsInPast > 0);
        vm.assume(secondsInPast <= block.timestamp);

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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: block.timestamp - secondsInPast,
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
            "PaymentProcessor__SaleHasExpired()");
    }

    function test_expiredBundledSaleListingShouldFail(uint256 secondsInPast) public {
        vm.assume(secondsInPast > 0);
        vm.assume(secondsInPast <= block.timestamp);
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = block.timestamp - secondsInPast;

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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__SaleHasExpired()");
    }

    function test_expiredSingleSaleOfferShouldFail(uint256 secondsInPast) public {
        vm.assume(secondsInPast > 0);
        vm.assume(secondsInPast <= block.timestamp);

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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: block.timestamp - secondsInPast,
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
            "PaymentProcessor__OfferHasExpired()");
    }

    function test_expiredBundledSaleOfferShouldFail(uint256 secondsInPast) public {
        vm.assume(secondsInPast > 0);
        vm.assume(secondsInPast <= block.timestamp);
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: block.timestamp - secondsInPast
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false, 
            "PaymentProcessor__OfferHasExpired()");
    }

    function test_nativeSingleSaleOverpaymentShouldFail(uint256 payment, uint256 salePrice) public {
        vm.assume(payment > salePrice);

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
        deal(saleDetails.buyer, saleDetails.offerPrice + 1 wei);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__OfferPriceMustEqualSalePrice()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice + 1 wei}(saleDetails, signedListing, signedOffer);
    }

    function test_nativeBundledSaleOverpaymentShouldFail(uint256 payment) public {
        uint256 numItemsInBundle = 10;

        vm.assume(payment > (1 ether * numItemsInBundle));

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, payment);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__OfferPriceMustEqualSalePrice()"))));
        paymentProcessor.sweepCollection{value: payment}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_nativeBatchSaleOverpaymentShouldFail(uint256 payment) public {
        uint256 numItemsInBundle = 10;

        vm.assume(payment > (1 ether * numItemsInBundle));

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
        SignatureECDSA[] memory signedOffers = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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
                    offerNonce: _getNextNonce(buyerEOA),
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            saleDetailsBatch[i] = saleDetails;

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);
            signedOffers[i] = _getSignedOffer(buyerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, payment);

        vm.startPrank(bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__OverpaidNativeFunds()"))));
        paymentProcessor.buyBatchOfListings{value: payment}(saleDetailsBatch, signedListings, signedOffers);
        vm.stopPrank();
    }

    function test_nativeSingleSaleUnderpaymentShouldFail(uint256 payment, uint256 salePrice) public {
        vm.assume(payment < salePrice);

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

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__OfferPriceMustEqualSalePrice()"))));
        paymentProcessor.buySingleListing{value: payment}(saleDetails, signedListing, signedOffer);
    }

    function test_nativeBundledSaleUnderpaymentShouldFail(uint256 payment) public {
        uint256 numItemsInBundle = 10;

        vm.assume(payment < (1 ether * numItemsInBundle));

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, payment);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__OfferPriceMustEqualSalePrice()"))));
        paymentProcessor.sweepCollection{value: payment}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_nativeBatchSaleUnderpaymentShouldFail(uint256 payment) public {
        uint256 numItemsInBundle = 10;

        vm.assume(payment < (1 ether * numItemsInBundle));

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
        SignatureECDSA[] memory signedOffers = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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
                    offerNonce: _getNextNonce(buyerEOA),
                    listingMinPrice: bundledOfferItems[i].itemPrice,
                    offerPrice: bundledOfferItems[i].itemPrice,
                    listingExpiration: bundledOfferItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledOfferItems[i].tokenId,
                    amount: bundledOfferItems[i].amount
                });

            saleDetailsBatch[i] = saleDetails;

            signedListings[i] = _getSignedListing(sellerKey, saleDetails);
            signedOffers[i] = _getSignedOffer(buyerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, payment);

        vm.startPrank(bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__RanOutOfNativeFunds()"))));
        paymentProcessor.buyBatchOfListings{value: payment}(saleDetailsBatch, signedListings, signedOffers);
        vm.stopPrank();
    }

    function test_coinSingleSaleWithNativeFundsShouldFail(uint256 nativeFundsAmount) public {
        vm.assume(nativeFundsAmount > 0);

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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        deal(saleDetails.buyer, nativeFundsAmount);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CannotIncludeNativeFundsWhenPaymentMethodIsAnERC20Coin()"))));
        paymentProcessor.buySingleListing{value: nativeFundsAmount}(saleDetails, signedListing, signedOffer);
    }

    function test_coinBundledSaleWithNativeFundsShouldFail(uint256 nativeFundsAmount) public {
        vm.assume(nativeFundsAmount > 0);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, nativeFundsAmount);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CannotIncludeNativeFundsWhenPaymentMethodIsAnERC20Coin()"))));
        paymentProcessor.sweepCollection{value: nativeFundsAmount}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_erc1155SingleSaleWithZeroAmountShouldFail() public {
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC1155,
            paymentCoin: address(0),
            tokenAddress: address(erc1155Mock),
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
            tokenId: _getNextAvailableTokenId(address(erc1155Mock)),
            amount: 0
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__AmountForERC1155SalesGreaterThanZero()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_erc1155BundledSaleWithZeroAmountShouldFail() public {
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC1155,
            paymentCoin: address(0),
            tokenAddress: address(erc1155Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc1155Mock));
            bundledOfferItems[i].amount = i;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__AmountForERC1155SalesGreaterThanZero()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_erc721SingleSaleWithAmountLessThanOrGreaterThanOneShouldFail(uint256 amount) public {
        vm.assume(amount != 1);

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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: amount
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__AmountForERC721SalesMustEqualOne()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_erc721BundledsSaleWithAmountLessThanOrGreaterThanOneShouldFail(uint256 amount) public {
        vm.assume(amount != 1);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = amount;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__AmountForERC721SalesMustEqualOne()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_privateSingleSaleWithIncorrectBuyerShouldFail(address privateBuyer) public {
        vm.assume(privateBuyer != address(0));
        vm.assume(privateBuyer != buyerEOA);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: privateBuyer,
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

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__BuyerMustBeDesignatedPrivateBuyer()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_privateBundledSaleWithIncorrectBuyerShouldFail(address privateBuyer) public {
        vm.assume(privateBuyer != address(0));
        vm.assume(privateBuyer != buyerEOA);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: privateBuyer,
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__BuyerMustBeDesignatedPrivateBuyer()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_delegatedSingleSaleWithIncorrectCallerShouldFail(address caller) public {
        vm.assume(caller != address(0));
        vm.assume(caller != delegatedPurchaserEOA);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: delegatedPurchaserEOA,
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
        deal(caller, saleDetails.offerPrice);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(caller);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerIsNotTheDelegatedPurchaser()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_delegatedBundledSaleWithIncorrectCallerShouldFail(address caller) public {
        vm.assume(caller != address(0));
        vm.assume(caller != delegatedPurchaserEOA);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: delegatedPurchaserEOA,
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(caller, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(caller);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerIsNotTheDelegatedPurchaser()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_matchedOrdersWithOfferBelowMinimumListingPriceShouldFail(uint256 offerPrice, uint256 listingPrice) public {
        vm.assume(offerPrice < listingPrice);

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
            listingMinPrice: listingPrice,
            offerPrice: offerPrice,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__SalePriceBelowSellerApprovedMinimum()"))));
        paymentProcessor.buySingleListing{value: offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_matchedBundledOrdersWithOfferBelowMinimumListingPriceShouldFail(uint256 offerPrice) public {
        uint256 numItemsInBundle = 10;

        vm.assume(offerPrice < 1 ether * numItemsInBundle);

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: offerPrice,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__BundledOfferPriceMustEqualSumOfAllListingPrices()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_marketplaceFeeAbove100PercentShouldFail(uint256 marketplaceFee) public {
        vm.assume(marketplaceFee > 10000);

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
            marketplaceFeeNumerator: marketplaceFee,
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

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__MarketplaceAndRoyaltyFeesWillExceedSalePrice()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_marketplaceFeeAbove100PercentForBundledSaleShouldFail(uint256 marketplaceFee) public {
        vm.assume(marketplaceFee > 10000);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: marketplaceFee,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__MarketplaceAndRoyaltyFeesWillExceedSalePrice()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_royaltyFeeAbove100PercentShouldFail(uint256 royaltyFee) public {
        vm.assume(royaltyFee > 10000);

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
            maxRoyaltyFeeNumerator: royaltyFee,
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

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__MarketplaceAndRoyaltyFeesWillExceedSalePrice()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_royaltyFeeAbove100PercentForBundledSaleShouldFail(uint256 royaltyFee) public {
        vm.assume(royaltyFee > 10000);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = royaltyFee;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__MarketplaceAndRoyaltyFeesWillExceedSalePrice()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_combinedMarketplaceAndRoyaltyFeeAbove100PercentShouldFail(uint256 marketplaceFee, uint256 royaltyFee) public {
        vm.assume(marketplaceFee <= 10000);
        vm.assume(royaltyFee <= 10000);
        vm.assume(marketplaceFee + royaltyFee > 10000);

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
            marketplaceFeeNumerator: marketplaceFee,
            maxRoyaltyFeeNumerator: royaltyFee,
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

        SignatureECDSA memory signedListing = _getSignedListing(sellerKey, saleDetails);
        SignatureECDSA memory signedOffer = _getSignedOffer(buyerKey, saleDetails);

        vm.startPrank(saleDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__MarketplaceAndRoyaltyFeesWillExceedSalePrice()"))));
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(saleDetails, signedListing, signedOffer);
    }

    function test_combinedMarketplaceAndRoyaltyFeeAbove100PercentForBundledSaleShouldFail(uint256 marketplaceFee, uint256 royaltyFee) public {
        vm.assume(marketplaceFee <= 10000);
        vm.assume(royaltyFee <= 10000);
        vm.assume(marketplaceFee + royaltyFee > 10000);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: marketplaceFee,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = royaltyFee;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__MarketplaceAndRoyaltyFeesWillExceedSalePrice()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_privateSaleShouldFailWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: buyerEOA,
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
            "PaymentProcessor__TokenSecurityPolicyDoesNotAllowPrivateListings()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_privateBundledSaleShouldFailWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS);
        
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: buyerEOA,
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(bundledOfferDetails.buyer);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__TokenSecurityPolicyDoesNotAllowPrivateListings()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_delegatedSaleShouldFailWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: delegatedPurchaserEOA,
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
            "PaymentProcessor__TokenSecurityPolicyDoesNotAllowDelegatedPurchases()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_delegatedBundledSaleShouldFailWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: delegatedPurchaserEOA,
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(delegatedPurchaserEOA, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(delegatedPurchaserEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__TokenSecurityPolicyDoesNotAllowDelegatedPurchases()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_multiSigSaleShouldFailWhenMultiSigConsidersSellerSignatureInvalid() public {
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: address(sellerMultiSig),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            maxRoyaltyFeeNumerator: 0,
            listingNonce: _getNextNonce(address(sellerMultiSig)),
            offerNonce: _getNextNonce(address(buyerMultiSig)),
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        sellerMultiSig.setSignaturesInvalid();

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__EIP1271SignatureInvalid()");
    }

    function test_multiSigBundledSaleShouldFailWhenMultiSigConsidersSellerSignatureInvalid() public {
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(address(buyerMultiSig)),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = address(sellerMultiSig);
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(address(sellerMultiSig));
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(address(buyerMultiSig), bundledOfferDetails.offerPrice);

        sellerMultiSig.setSignaturesInvalid();

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__EIP1271SignatureInvalid()"))));
        buyerMultiSig.sweepCollection(address(paymentProcessor), signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_multiSigSaleShouldFailWhenMultiSigConsidersBuyerSignatureInvalid() public {
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: address(sellerMultiSig),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            maxRoyaltyFeeNumerator: 0,
            listingNonce: _getNextNonce(address(sellerMultiSig)),
            offerNonce: _getNextNonce(address(buyerMultiSig)),
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: _getNextAvailableTokenId(address(erc721Mock)),
            amount: 1
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        buyerMultiSig.setSignaturesInvalid();

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__EIP1271SignatureInvalid()");
    }

    function test_multiSigBundledSaleShouldFailWhenMultiSigConsidersBuyerSignatureInvalid() public {
        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(address(buyerMultiSig)),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = address(sellerMultiSig);
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(address(sellerMultiSig));
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(address(buyerMultiSig), bundledOfferDetails.offerPrice);

        buyerMultiSig.setSignaturesInvalid();

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__EIP1271SignatureInvalid()"))));
        buyerMultiSig.sweepCollection(address(paymentProcessor), signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_multiSigSaleShouldFailForSellerWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: address(sellerMultiSig),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            maxRoyaltyFeeNumerator: 0,
            listingNonce: _getNextNonce(address(sellerMultiSig)),
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
            "PaymentProcessor__EIP1271SignaturesAreDisabled()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_multiSigBundledSaleShouldFailForSellerWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = address(sellerMultiSig);
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(address(sellerMultiSig));
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(buyerEOA, bundledOfferDetails.offerPrice);

        sellerMultiSig.setSignaturesInvalid();

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__EIP1271SignaturesAreDisabled()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_multiSigSaleShouldFailForBuyerWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            maxRoyaltyFeeNumerator: 0,
            listingNonce: _getNextNonce(sellerEOA),
            offerNonce: _getNextNonce(address(buyerMultiSig)),
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
            "PaymentProcessor__EIP1271SignaturesAreDisabled()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_multiSigBundledSaleShouldFailForBuyerWhenDisabledBySecurityPolicy() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(address(buyerMultiSig)),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(address(buyerMultiSig), bundledOfferDetails.offerPrice);

        buyerMultiSig.setSignaturesInvalid();

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__EIP1271SignaturesAreDisabled()"))));
        buyerMultiSig.sweepCollection(address(paymentProcessor), signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_multiSigSaleShouldFailWhenDisabledBySecurityPolicyAndWhitelistedCallersEnforced() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_RESTRICTIVE);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: address(sellerMultiSig),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            maxRoyaltyFeeNumerator: 0,
            listingNonce: _getNextNonce(address(sellerMultiSig)),
            offerNonce: _getNextNonce(address(buyerMultiSig)),
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
            "PaymentProcessor__EIP1271SignaturesAreDisabled()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_multiSigBundledSaleShouldFailWhenDisabledBySecurityPolicyAndWhitelistedCallersEnforced() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_RESTRICTIVE);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: address(buyerMultiSig),
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(address(buyerMultiSig)),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = address(sellerMultiSig);
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(address(sellerMultiSig));
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(address(buyerMultiSig), bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__EIP1271SignaturesAreDisabled()"))));
        buyerMultiSig.sweepCollection(address(paymentProcessor), signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_saleShouldFailWhenWhitelistIsEnforcedAndEOACallersAreNotAllowed() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED);

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
            "PaymentProcessor__TokenSecurityPolicyDoesNotAllowEOACallers()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_bundledSaleShouldFailWhenWhitelistIsEnforcedAndEOACallersAreNotAllowed() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(buyerEOA, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA, buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__TokenSecurityPolicyDoesNotAllowEOACallers()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_delegatedSaleShouldFailWhenWhitelistIsEnforcedAndEOACallersAreNotAllowed() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED);

        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            seller: sellerEOA,
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: delegatedPurchaserEOA,
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
            "PaymentProcessor__TokenSecurityPolicyDoesNotAllowEOACallers()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_delegatedBundledSaleShouldFailWhenWhitelistIsEnforcedAndEOACallersAreNotAllowed() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: delegatedPurchaserEOA,
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(delegatedPurchaserEOA, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(delegatedPurchaserEOA, delegatedPurchaserEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__TokenSecurityPolicyDoesNotAllowEOACallers()"))));
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_marketplacePassthroughSaleShouldFailWhenWhitelistIsEnforcedAndMarketplaceIsNotWhitelisted() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);

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
            marketplace: address(marketplaceMockUnwhitelisted),
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
            true, 
            "PaymentProcessor__CallerIsNotWhitelistedMarketplace()");

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_marketplacePassthroughBundledSaleShouldFailWhenWhitelistIsEnforcedAndMarketplaceIsNotWhitelisted() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMockUnwhitelisted),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(buyerEOA, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__CallerIsNotWhitelistedMarketplace()"))));
        marketplaceMockUnwhitelisted.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();
    }

    function test_revertsWhenBatchSaleHasMismatchedArrayLengths(uint256 arrayLength) public {
        vm.assume(arrayLength > 0 && arrayLength < 1000);
        
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__InputArrayLengthMismatch()"))));
        paymentProcessor.buyBatchOfListings(
            new MatchedOrder[](arrayLength),
            new SignatureECDSA[](arrayLength + 1),
            new SignatureECDSA[](arrayLength + 2));
    }

    function test_revertsWhenBatchSaleHasZeroLengthArrays() public {
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__InputArrayLengthCannotBeZero()"))));
        paymentProcessor.buyBatchOfListings(
            new MatchedOrder[](0),
            new SignatureECDSA[](0),
            new SignatureECDSA[](0));
    }

    function test_revertsWhenBundledSaleHasMismatchedArrayLengths(uint256 arrayLength) public {

        vm.assume(arrayLength > 0 && arrayLength < 1000);

        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__InputArrayLengthMismatch()"))));
        paymentProcessor.sweepCollection(
            SignatureECDSA(0, 0, 0),
            MatchedOrderBundleBase(
                TokenProtocols.ERC721,
                address(0),
                address(0),
                address(0),
                address(0),
                address(0),
                address(0),
                0,
                0,
                0,
                0
            ),
            new BundledItem[](arrayLength),
            new SignatureECDSA[](arrayLength + 1));
    }

    function test_revertsWhenBundledSaleHasZeroLengthArrays() public {
        vm.expectRevert(bytes4(keccak256(abi.encodePacked("PaymentProcessor__InputArrayLengthCannotBeZero()"))));
        paymentProcessor.sweepCollection(
            SignatureECDSA(0, 0, 0),
            MatchedOrderBundleBase(
                TokenProtocols.ERC721,
                address(0),
                address(0),
                address(0),
                address(0),
                address(0),
                address(0),
                0,
                0,
                0,
                0
            ),
            new BundledItem[](0),
            new SignatureECDSA[](0));
    }
}

contract Sales is PaymentProcessorSaleScenarioBase {

    function test_marketplacePassthroughSaleShouldSuccedWhenWhitelistIsEnforcedAndMarketplaceIsWhitelisted() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);

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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
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
            true);

        assertEq(erc721Mock.balanceOf(buyerEOA), 1);
        assertEq(erc721Mock.ownerOf(0), buyerEOA);
        assertEq(sellerEOA.balance, 1 ether);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_marketplacePassthroughBundledSaleShouldSuccedWhenWhitelistIsEnforcedAndMarketplaceIsWhitelisted() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(buyerEOA, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA);
        marketplaceMock.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();

        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle);

        for(uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }
        
        assertEq(sellerEOA.balance, 1 ether * numItemsInBundle);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);
    }

    function test_nonContractAccountsCanMakePurchasesWhenWhitelistIsEnforced() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);

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
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
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

        assertEq(erc721Mock.balanceOf(buyerEOA), 1);
        assertEq(erc721Mock.ownerOf(0), buyerEOA);
        assertEq(sellerEOA.balance, 1 ether);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);

        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_MOST_PERMISSIVE);
    }

    function test_nonContractAccountsCanMakeBundledPurchasesWhenWhitelistIsEnforced() public {
        paymentProcessor.setCollectionSecurityPolicy(address(erc721Mock), SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);

        uint256 numItemsInBundle = 10;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].seller = sellerEOA;
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
            bundledOfferItems[i].listingNonce = _getNextNonce(sellerEOA);
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingExpiration = type(uint256).max;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledOfferItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(buyerEOA, bundledOfferDetails.offerPrice);

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);

        vm.startPrank(buyerEOA, buyerEOA);
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();

        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle);

        for(uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }
        
        assertEq(sellerEOA.balance, 1 ether * numItemsInBundle);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);
    }

    function test_revertsWhenBuyBundledListingCalledWIthNoItems() public {

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(0),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 0,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 0 ether,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: sellerEOA,
            listingNonce: _getNextNonce(sellerEOA),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](0);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](0),
            amounts: new uint256[](0),
            salePrices: new uint256[](0),
            maxRoyaltyFeeNumerators: new uint256[](0),
            sellers: new address[](0),
            sumListingPrices: 0
        });

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        _executeBundledListingPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundleOfferDetailsExtended, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            _getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            bundledOfferItems,
            false,
            "PaymentProcessor__InputArrayLengthCannotBeZero()");
    }
}