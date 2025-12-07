pragma solidity 0.8.9;

import "../../../PaymentProcessorSaleScenarioBase.t.sol";

contract BundledSaleRoyaltyFee is PaymentProcessorSaleScenarioBase {

    uint256 numItemsInBundle;

    function setUp() public virtual override {
        super.setUp();

        numItemsInBundle = 100;
    }

    function test_executeSale() public {

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC1155,
            paymentCoin: address(approvedPaymentCoin),
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
            bundledOfferItems[i].amount = 10;
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

        _executeBundledPurchase(
            bundledOfferDetails.buyer, 
            bundledOfferDetails, 
            _getSignedOfferForBundledItems(buyerKey, bundledOfferDetails, bundledOfferItems),
            bundledOfferItems, 
            signedListings,
            false);

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            assertEq(erc1155Mock.balanceOf(sellerEOA, i), 0);
            assertEq(erc1155Mock.balanceOf(buyerEOA, i), 10);
        }

        assertEq(approvedPaymentCoin.balanceOf(sellerEOA), 0.9 ether * numItemsInBundle);
        assertEq(approvedPaymentCoin.balanceOf(buyerEOA), 0 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(marketplaceMock)), 0 ether * numItemsInBundle);
        assertEq(approvedPaymentCoin.balanceOf(address(royaltyReceiverMock)), 0.1 ether * numItemsInBundle);
    }
}