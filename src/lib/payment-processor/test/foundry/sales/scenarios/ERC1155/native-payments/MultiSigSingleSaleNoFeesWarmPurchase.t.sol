pragma solidity 0.8.9;

import "../../../PaymentProcessorSaleScenarioBase.t.sol";

contract MultiSigSingleSaleNoFeesWarmPurchase is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();

        erc1155Mock.mintTo(address(sellerMultiSig), _getNextAvailableTokenId(address(erc1155Mock)), 100);
        erc1155Mock.mintTo(address(sellerMultiSig), _getNextAvailableTokenId(address(erc1155Mock)), 100);
        erc1155Mock.mintTo(address(sellerMultiSig), _getNextAvailableTokenId(address(erc1155Mock)), 80);
        erc1155Mock.mintTo(address(buyerMultiSig), 2, 10);
    }

    function test_executeSale() public {
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC1155,
            paymentCoin: address(0),
            tokenAddress: address(erc1155Mock),
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
            tokenId: 2,
            amount: 10
        });

        _mintAndDealTokensForSale(saleDetails.protocol, address(0), saleDetails);

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false);

        assertEq(erc1155Mock.balanceOf(address(sellerMultiSig), 0), 100);
        assertEq(erc1155Mock.balanceOf(address(sellerMultiSig), 1), 100);
        assertEq(erc1155Mock.balanceOf(address(sellerMultiSig), 2), 80);
        assertEq(erc1155Mock.balanceOf(address(buyerMultiSig), 0), 0);
        assertEq(erc1155Mock.balanceOf(address(buyerMultiSig), 1), 0);
        assertEq(erc1155Mock.balanceOf(address(buyerMultiSig), 2), 20);

        assertEq(address(sellerMultiSig).balance, 1 ether);
        assertEq(address(buyerMultiSig).balance, 0 ether);
        assertEq(address(marketplaceMock).balance, 0 ether);
        assertEq(address(royaltyReceiverMock).balance, 0 ether);
    }
}