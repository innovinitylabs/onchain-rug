pragma solidity 0.8.9;

import "../../../PaymentProcessorSaleScenarioBase.t.sol";

contract SingleSaleMarketplaceAndRoyaltyFeeWarmPurchase is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();

        erc1155Mock.mintTo(sellerEOA, _getNextAvailableTokenId(address(erc1155Mock)), 100);
        erc1155Mock.mintTo(sellerEOA, _getNextAvailableTokenId(address(erc1155Mock)), 100);
        erc1155Mock.mintTo(sellerEOA, _getNextAvailableTokenId(address(erc1155Mock)), 90);

        vm.prank(sellerEOA);
        erc1155Mock.safeTransferFrom(sellerEOA, buyerEOA, 2, 10, "");
    }

    function test_executeSale() public {
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
            marketplaceFeeNumerator: 500,
            maxRoyaltyFeeNumerator: 1000,
            listingNonce: _getNextNonce(sellerEOA),
            offerNonce: _getNextNonce(buyerEOA),
            listingMinPrice: 1 ether,
            offerPrice: 1 ether,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: 2,
            amount: 10
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(royaltyReceiverMock), saleDetails);

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false);

        assertEq(erc1155Mock.balanceOf(sellerEOA, 0), 100);
        assertEq(erc1155Mock.balanceOf(sellerEOA, 1), 100);
        assertEq(erc1155Mock.balanceOf(sellerEOA, 2), 80);
        assertEq(erc1155Mock.balanceOf(buyerEOA, 0), 0);
        assertEq(erc1155Mock.balanceOf(buyerEOA, 1), 0);
        assertEq(erc1155Mock.balanceOf(buyerEOA, 2), 20);

        assertEq(sellerEOA.balance, 0.85 ether);
        assertEq(buyerEOA.balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0.05 ether);
        assertEq(address(royaltyReceiverMock).balance, 0.1 ether);
    }
}