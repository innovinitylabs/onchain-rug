pragma solidity 0.8.9;

import "../../../PaymentProcessorSaleScenarioBase.t.sol";

contract BuyBundledListingRoyaltyFee is PaymentProcessorSaleScenarioBase {

    uint256 numItemsInBundle;

    function setUp() public virtual override {
        super.setUp();

        numItemsInBundle = 100;
    }

    function test_executeSale() public {

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
            bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(erc1155Mock));
            bundledOfferItems[i].amount = 10;
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

        _executeBundledListingPurchase(
            bundledOfferDetails.buyer, 
            bundleOfferDetailsExtended, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            _getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            bundledOfferItems,
            false);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc1155Mock.balanceOf(sellerEOA, i), 0);
            assertEq(erc1155Mock.balanceOf(buyerEOA, i), 10);
        }

        assertEq(sellerEOA.balance, 0.9 ether * numItemsInBundle);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0.1 ether * numItemsInBundle);
    }
}