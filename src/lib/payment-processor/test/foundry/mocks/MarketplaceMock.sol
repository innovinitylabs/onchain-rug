// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "contracts/PaymentProcessor.sol";

contract MarketplaceMock {
    PaymentProcessor paymentProcessor;

    constructor(PaymentProcessor paymentProcessor_) {
        paymentProcessor = paymentProcessor_;
    }

    receive() external payable {}

    function buySingleListing(
        MatchedOrder memory saleDetails,
        SignatureECDSA memory signedListing,
        SignatureECDSA memory signedOffer
    ) external payable {
        paymentProcessor.buySingleListing{value: msg.value}(saleDetails, signedListing, signedOffer);
    }

    function buyBatchOfListings(
        MatchedOrder[] calldata saleDetailsArray,
        SignatureECDSA[] calldata signedListings,
        SignatureECDSA[] calldata signedOffers
    ) external payable {
        paymentProcessor.buyBatchOfListings{value: msg.value}(saleDetailsArray, signedListings, signedOffers);
    }

    function sweepCollection(
        SignatureECDSA memory signedOffer,
        MatchedOrderBundleBase memory bundleDetails,
        BundledItem[] calldata bundleItems,
        SignatureECDSA[] calldata signedListings
    ) external payable {
        paymentProcessor.sweepCollection{value: msg.value}(
            signedOffer, 
            bundleDetails, 
            bundleItems, 
            signedListings);
    }
}