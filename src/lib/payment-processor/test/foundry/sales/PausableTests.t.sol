pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract PausableTests is PaymentProcessorSaleScenarioBase {

    address contractOwner = vm.addr(0x9eadbeef);

    function setUp() public virtual override {
        super.setUp();

        paymentProcessor.transferOwnership(contractOwner);
    }

    function test_revertsWhenPauseIsCalledByUnauthorizedUser(address account) public {
        vm.assume(account != address(0));
        vm.assume(account != paymentProcessor.owner());

        vm.prank(account);
        vm.expectRevert("Ownable: caller is not the owner");
        paymentProcessor.pause();
        assertFalse(paymentProcessor.paused());
    }

    function test_revertsWhenUnpauseIsCalledByUnauthorizedUser(address account) public {
        vm.assume(account != address(0));
        vm.assume(account != paymentProcessor.owner());

        vm.prank(account);
        vm.expectRevert("Ownable: caller is not the owner");
        paymentProcessor.unpause();
        assertFalse(paymentProcessor.paused());
    }

    function test_revertsWhenUnpauseIsCalledByContractOwnerIfContractNotCurrentlyPaused() public {
        vm.prank(contractOwner);
        vm.expectRevert("Pausable: not paused");
        paymentProcessor.unpause();
        assertFalse(paymentProcessor.paused());
    }

    function test_revertsWhenPauseIsCalledByContractOwnerIfContractAlreadyPaused() public {
        vm.startPrank(contractOwner);
        paymentProcessor.pause();
        vm.expectRevert("Pausable: paused");
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());
        vm.stopPrank();
    }

    function test_canPauseWhenUnpaused() public {
        vm.prank(contractOwner);
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());
    }

    function test_canUnpauseWhenPaused() public {
        vm.startPrank(contractOwner);
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());
        paymentProcessor.unpause();
        assertFalse(paymentProcessor.paused());
        vm.stopPrank();
    }

    function test_canBuySingleListingWhenUnpaused() public {
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
    }

    function test_revertsBuySingleListingWhenPaused() public {
        vm.prank(contractOwner);
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());

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

        vm.prank(buyerEOA);
        vm.expectRevert("Pausable: paused");
        paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(
            saleDetails, 
            signedListing, 
            signedOffer);
    }

    function test_canBuyBatchOfListingsWhenUnpaused() public {
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

        _executeBatchedSale(
            bundledOfferDetails.delegatedPurchaser != address(0) ? bundledOfferDetails.delegatedPurchaser : bundledOfferDetails.buyer,
            saleDetailsBatch,
            signedListings,
            signedOffers,
            false);

        assertEq(erc721Mock.balanceOf(sellerEOA), 0);
        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }

        assertEq(sellerEOA.balance, 1 ether * numItemsInBundle);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);
    }

    function test_revertsBuyBatchOfListingsWhenPaused() public {
        vm.prank(contractOwner);
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());

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

        vm.prank(buyerEOA);
        vm.expectRevert("Pausable: paused");
        paymentProcessor.buyBatchOfListings{value: bundledOfferDetails.offerPrice}(
            saleDetailsBatch, 
            signedListings, 
            signedOffers);
    }

    function test_canBuyBundledListingWhenUnpaused() public {

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
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        _executeBundledListingPurchase(
            bundledOfferDetails.buyer, 
            bundleOfferDetailsExtended, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            _getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            bundledOfferItems,
            false);

        assertEq(erc721Mock.balanceOf(sellerEOA), 0);
        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }

        assertEq(sellerEOA.balance, 1 ether * numItemsInBundle);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);
    }

    function test_revertsBuyBundledListingWhenPaused() public {
        vm.prank(contractOwner);
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());

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
            bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
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

            _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);
        }

        vm.deal(bundledOfferDetails.buyer, bundledOfferDetails.offerPrice);

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems);
        SignatureECDSA memory signedListing = _getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended);

        vm.prank(buyerEOA);
        vm.expectRevert("Pausable: paused");
        paymentProcessor.buyBundledListing{value: bundledOfferDetails.offerPrice}(
            signedListing,
            signedOffer, 
            bundleOfferDetailsExtended, 
            bundledOfferItems);
    }

    function test_canSweepCollectionWhenUnpaused() public {
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

        _executeBundledPurchase(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false);

        assertEq(erc721Mock.balanceOf(sellerEOA), 0);
        assertEq(erc721Mock.balanceOf(buyerEOA), numItemsInBundle);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc721Mock.ownerOf(i), buyerEOA);
        }

        assertEq(sellerEOA.balance, 1 ether * numItemsInBundle);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);
    }

    function test_revertsSweepCollectionWhenPaused() public {
        vm.prank(contractOwner);
        paymentProcessor.pause();
        assertTrue(paymentProcessor.paused());

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
        vm.expectRevert("Pausable: paused");
        paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(
            signedOffer,
            bundledOfferDetails,
            bundledOfferItems,
            signedListings);
    }
}