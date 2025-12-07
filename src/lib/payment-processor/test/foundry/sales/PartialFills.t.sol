pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract PartialFills is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();
    }

    function test_batchSaleFailsOnIncompleteFillWithNativeCurrency() public {
         
        uint256 numItemsInBundle = 100;

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
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), bundledOfferItems[bundledOfferItems.length - 1].tokenId);

        _executeBatchedSaleExpectingRevert(
            bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer,
            saleDetailsBatch,
            signedListings,
            signedOffers,
            false,
            "PaymentProcessor__DispensingTokenWasUnsuccessful()");
    }

    function test_batchSalePartiallyFillsWithERC20Currency() public {
         
        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
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
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), bundledOfferItems[bundledOfferItems.length - 1].tokenId);

        _executeBatchedSale(
            bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer,
            saleDetailsBatch,
            signedListings,
            signedOffers,
            false);

        assertEq(erc721Mock.balanceOf(sellerEOA), 0);
        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle - 1);

        for (uint256 i = 0; i < numItemsInBundle - 1; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }

        assertEq(approvedPaymentCoin.balanceOf(sellerEOA), 0.85 ether * (numItemsInBundle - 1));
        assertEq(approvedPaymentCoin.balanceOf(buyerEOA), 1 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(marketplaceMock)), 0.05 ether * (numItemsInBundle - 1));
        assertEq(approvedPaymentCoin.balanceOf(address(royaltyReceiverMock)), 0.1 ether * (numItemsInBundle - 1));
    }

    function test_bundledItemSaleFailsOnIncompleteFillWithNativeCurrency() public {

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
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: sellerEOA,
            listingNonce: _getNextNonce(sellerEOA),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](numItemsInBundle),
            amounts: new uint256[](numItemsInBundle),
            salePrices: new uint256[](numItemsInBundle),
            maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
            sellers: new address[](numItemsInBundle),
            sumListingPrices: 0
        });

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingNonce = 0;
            bundledOfferItems[i].listingExpiration = 0;
            bundledOfferItems[i].seller = sellerEOA;

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

            accumulator.tokenIds[i] = saleDetails.tokenId;
            accumulator.amounts[i] = saleDetails.amount;
            accumulator.salePrices[i] = saleDetails.listingMinPrice;
            accumulator.maxRoyaltyFeeNumerators[i] = saleDetails.maxRoyaltyFeeNumerator;
            accumulator.sellers[i] = sellerEOA;
            accumulator.sumListingPrices += saleDetails.listingMinPrice;

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), bundledOfferItems[bundledOfferItems.length - 1].tokenId);

        _executeBundledListingPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundleOfferDetailsExtended, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            _getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            bundledOfferItems,
            false,
            "PaymentProcessor__DispensingTokenWasUnsuccessful()");
    }

    function test_bundledItemSalePartiallyFillsWithERC20Currency() public {

        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
            offerNonce: _getNextNonce(buyerEOA),
            offerPrice: 1 ether * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: sellerEOA,
            listingNonce: _getNextNonce(sellerEOA),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](numItemsInBundle),
            amounts: new uint256[](numItemsInBundle),
            salePrices: new uint256[](numItemsInBundle),
            maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
            sellers: new address[](numItemsInBundle),
            sumListingPrices: 0
        });

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc721Mock));
            bundledOfferItems[i].amount = 1;
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
            bundledOfferItems[i].itemPrice = 1 ether;
            bundledOfferItems[i].listingNonce = 0;
            bundledOfferItems[i].listingExpiration = 0;
            bundledOfferItems[i].seller = sellerEOA;

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

            accumulator.tokenIds[i] = saleDetails.tokenId;
            accumulator.amounts[i] = saleDetails.amount;
            accumulator.salePrices[i] = saleDetails.listingMinPrice;
            accumulator.maxRoyaltyFeeNumerators[i] = saleDetails.maxRoyaltyFeeNumerator;
            accumulator.sellers[i] = sellerEOA;
            accumulator.sumListingPrices += saleDetails.listingMinPrice;

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), bundledOfferItems[bundledOfferItems.length - 1].tokenId);

        _executeBundledListingPurchase(
            bundledOfferDetails.buyer, 
            bundleOfferDetailsExtended, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            _getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            bundledOfferItems,
            false);

        assertEq(erc721Mock.balanceOf(sellerEOA), 0);
        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle - 1);

        for (uint256 i = 0; i < numItemsInBundle - 1; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }

        assertEq(approvedPaymentCoin.balanceOf(sellerEOA), 0.85 ether * (numItemsInBundle - 1));
        assertEq(approvedPaymentCoin.balanceOf(buyerEOA), 1 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(marketplaceMock)), 0.05 ether * (numItemsInBundle - 1));
        assertEq(approvedPaymentCoin.balanceOf(address(royaltyReceiverMock)), 0.1 ether * (numItemsInBundle - 1));
    }

    function test_collectionSweepFailsOnIncompleteFillWithNativeCurrency() public {

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
            offerPrice: 1 ether * numItemsInBundle,
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), bundledOfferItems[bundledOfferItems.length - 1].tokenId);

        _executeBundledPurchaseExpectingRevert(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false,
            "PaymentProcessor__DispensingTokenWasUnsuccessful()");
    }

    function test_collectionSweepPartiallyFillsWithERC20Currency() public {

        uint256 numItemsInBundle = 100;

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
            tokenAddress: address(erc721Mock),
            privateBuyer: address(0),
            buyer: buyerEOA,
            delegatedPurchaser: address(0),
            marketplace: address(marketplaceMock),
            marketplaceFeeNumerator: 500,
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
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), bundledOfferItems[bundledOfferItems.length - 1].tokenId);

        _executeBundledPurchase(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false);

        assertEq(erc721Mock.balanceOf(sellerEOA), 0);
        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle - 1);

        for (uint256 i = 0; i < numItemsInBundle - 1; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }

        assertEq(approvedPaymentCoin.balanceOf(sellerEOA), 0.85 ether * (numItemsInBundle - 1));
        assertEq(approvedPaymentCoin.balanceOf(buyerEOA), 1 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(marketplaceMock)), 0.05 ether * (numItemsInBundle - 1));
        assertEq(approvedPaymentCoin.balanceOf(address(royaltyReceiverMock)), 0.1 ether * (numItemsInBundle - 1));
    }
}