pragma solidity 0.8.9;

import "../../../PaymentProcessorSaleScenarioBase.t.sol";

contract MultiSigSingleSaleNoFeesWarmPurchase is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();

        erc721Mock.mintTo(address(buyerMultiSig), _getNextAvailableTokenId(address(erc721Mock)));
        erc721Mock.mintTo(address(sellerMultiSig), _getNextAvailableTokenId(address(erc721Mock)));
    }

    function test_executeSale() public {
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol: TokenProtocols.ERC721,
            paymentCoin: address(approvedPaymentCoin),
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

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false);

        assertEq(erc721Mock.balanceOf(address(sellerMultiSig)), 1);
        assertEq(erc721Mock.balanceOf(address(buyerMultiSig)), 2);

        assertEq(erc721Mock.ownerOf(0), address(buyerMultiSig));
        assertEq(erc721Mock.ownerOf(1), address(sellerMultiSig));
        assertEq(erc721Mock.ownerOf(2), address(buyerMultiSig));

        assertEq(approvedPaymentCoin.balanceOf(address(sellerMultiSig)), 1 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(buyerMultiSig)), 0 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(marketplaceMock)), 0 ether);
        assertEq(approvedPaymentCoin.balanceOf(address(royaltyReceiverMock)), 0 ether);
    }
}