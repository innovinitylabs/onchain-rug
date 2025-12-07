pragma solidity 0.8.9;

import "./PaymentProcessorSaleScenarioBase.t.sol";

contract SingleSaleItemUnavailable is PaymentProcessorSaleScenarioBase {

    function setUp() public virtual override {
        super.setUp();

        erc721Mock.mintTo(sellerEOA, _getNextAvailableTokenId(address(erc721Mock)));
        erc721Mock.mintTo(sellerEOA, _getNextAvailableTokenId(address(erc721Mock)));

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, buyerEOA, 0);
    }

    function test_revertsWhenNFTTransferFailsDuringSaleNativeCurrency() public {
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

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), saleDetails.tokenId);

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__DispensingTokenWasUnsuccessful()");
    }

    function test_revertsWhenNFTTransferFailsDuringSaleERC20Currency() public {
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

        vm.prank(sellerEOA);
        erc721Mock.transferFrom(sellerEOA, address(0xdeadbeef), saleDetails.tokenId);

        _executeSingleSaleExpectingRevert(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            _getSignedListing(sellerKey, saleDetails), 
            _getSignedOffer(buyerKey, saleDetails),
            false,
            "PaymentProcessor__DispensingTokenWasUnsuccessful()");
    }
}