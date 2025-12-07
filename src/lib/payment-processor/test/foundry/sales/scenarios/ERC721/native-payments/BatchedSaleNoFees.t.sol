pragma solidity 0.8.9;

import "../../../PaymentProcessorSaleScenarioBase.t.sol";

contract BundledSaleNoFees is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();
    }

    function test_executeSale() public {
         
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
}