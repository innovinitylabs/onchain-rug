pragma solidity 0.8.9;

struct FuzzedSaleInputs {
    uint256 paymentCoinIndex;
    uint256 collectionIndex;
    uint256 marketplaceIndex;
    uint256 marketplaceFee;
    uint256 royaltyReceiverIndex;
    uint256 royaltyFee;
    uint256 price;
    uint256 amount;
    bool isPrivateSale;
    bool isDelegatedPurchase;
}

struct ActorKeys {
    bool shouldReturnEarly;
    uint256 sellerKey;
    uint256 buyerKey;
    uint256 delegatedPurchaserKey;
}