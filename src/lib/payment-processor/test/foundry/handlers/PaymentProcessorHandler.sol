pragma solidity 0.8.9;

import {CommonBase} from "forge-std/Base.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";
import {console} from "forge-std/console.sol";

import "./ForcePush.sol";
import "../mocks/ERC20Mock.sol";
import "../mocks/ERC721Mock.sol";
import "../mocks/ERC1155Mock.sol";
import "../mocks/MarketplaceMock.sol";
import "../mocks/MultiSigMock.sol";
import "../mocks/RoyaltyReceiverMock.sol";
import "../utils/LibAddressSet.sol";
import "../utils/Stack.sol";
import "../utils/TestStructs.sol";
import "contracts/PaymentProcessor.sol";

contract PaymentProcessorHandler  is CommonBase, StdCheats, StdUtils {
    using LibAddressSet for AddressSet;

    PaymentProcessor paymentProcessor;

    uint256 public constant ETH_SUPPLY = 120_500_000 ether;

    MultiSigMock internal immutable sellerMultiSig;
    MultiSigMock internal immutable buyerMultiSig;

    uint256 public ghost_forcePushSum;
    uint256 public ghost_withdrawSum;

    uint256 public ghost_sumOfPurchasePriceNative;
    uint256 public ghost_sumOfPurchasePriceCoins;
    uint256 public ghost_sumOfERC721TokensSold;
    uint256 public ghost_sumOfERC1155TokensSold;
    uint256 public ghost_numberOfERC721SalesViaPassthroughMarketplaces;
    uint256 public ghost_numberOfERC1155SalesViaPassthroughMarketplaces;

    mapping (address => uint256) public ghost_expectedSumOfEtherProceeds;
    mapping (address => uint256) public ghost_expectedSumOfCoinProceeds;
    mapping (address => uint256) public ghost_expectedERC721Balances;
    mapping (address => uint256) public ghost_expectedERC1155Balances;
    mapping (address => uint256) public ghost_expectedERC20Balances;

    AddressSet internal _erc721Collections;
    AddressSet internal _erc1155Collections;
    AddressSet internal _marketplaces;
    AddressSet internal _coins;
    AddressSet internal _royaltyReceivers;
    AddressSet internal _sellerActors;
    AddressSet internal _buyerActors;

    uint256 immutable private SECURITY_POLICY_MOST_PERMISSIVE;
    uint256 immutable private SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS;
    uint256 immutable private SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES;
    uint256 immutable private SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES;
    uint256 immutable private SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED;
    uint256 immutable private SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED;

    uint256[] private _securityPolicies;

    mapping (address => uint256) internal _nextAvailableTokenId;
    mapping (address => uint256) internal _nonces;

    function getBuyerMultiSigAddress() public view returns (address) {
        return address(buyerMultiSig);
    }

    constructor(
        PaymentProcessor paymentProcessor_, 
        uint256 numERC721Collections,
        uint256 numERC1155Collections,
        uint256 numMarketplaces,
        uint256 numRoyaltyReceivers,
        address[] memory coinAddresses) {
        paymentProcessor = paymentProcessor_;

        for (uint256 i = 0; i < numERC721Collections; ++i) {
            ERC721Mock erc721Mock = new ERC721Mock("Test", "TEST");
            _erc721Collections.add(address(erc721Mock));
        }

        for (uint256 i = 0; i < numERC1155Collections; ++i) {
            ERC1155Mock erc1155Mock = new ERC1155Mock();
            _erc1155Collections.add(address(erc1155Mock));
        }

        for (uint256 i = 0; i < numMarketplaces; ++i) {
            MarketplaceMock marketplaceMock = new MarketplaceMock(paymentProcessor_);
            _marketplaces.add(address(marketplaceMock));
        }

        for (uint256 i = 0; i < numRoyaltyReceivers; ++i) {
            RoyaltyReceiverMock royaltyReceiverMock = new RoyaltyReceiverMock();
            _royaltyReceivers.add(address(royaltyReceiverMock));
        }

        for (uint8 i = 0; i < coinAddresses.length; ++i) {
            _coins.add(coinAddresses[i]);
        }

        SECURITY_POLICY_MOST_PERMISSIVE = paymentProcessor.DEFAULT_SECURITY_POLICY_ID();

        SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            false,
            true, 
            false, 
            false, 
            false, 
            2300, 
            "DISABLE PRIVATE LISTINGS");

        SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            false,
            false, 
            true, 
            false, 
            false, 
            2300, 
            "DISABLE DELEGATED PURCHASES");

        SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES = paymentProcessor.createSecurityPolicy(
            false, 
            false, 
            false,
            false, 
            false, 
            true, 
            false, 
            2300, 
            "DISABLE EIP 1271 SIGNATURES");

        SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED = paymentProcessor.createSecurityPolicy(
            true, 
            false, 
            false,
            false, 
            false, 
            false, 
            false, 
            2300, 
            "ENFORCE EXCHANGE WHITELIST EOA CALLERS ALLOWED");

        SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED = paymentProcessor.createSecurityPolicy(
            true, 
            false, 
            false,
            false, 
            false, 
            false, 
            true, 
            2300, 
            "ENFORCE EXCHANGE WHITELIST EOA CALLERS NOT ALLOWED");

        // Whitelist all but one marketplace
        for (uint256 i = 0; i < numMarketplaces - 1; ++i) {
            paymentProcessor.whitelistExchange(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED, _marketplaces.at(i));
            paymentProcessor.whitelistExchange(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED, _marketplaces.at(i));
        }

        _securityPolicies.push(SECURITY_POLICY_MOST_PERMISSIVE);
        _securityPolicies.push(SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS);
        _securityPolicies.push(SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES);
        _securityPolicies.push(SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES);
        _securityPolicies.push(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);
        _securityPolicies.push(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED);

        sellerMultiSig = new MultiSigMock();
        buyerMultiSig = new MultiSigMock();

        _sellerActors.add(address(sellerMultiSig));
        _buyerActors.add(address(buyerMultiSig));

        deal(address(this), ETH_SUPPLY);
    }

    receive() external payable {}

    function forcePush(uint256 amount) public {
        amount = bound(amount, 0, address(this).balance);

        ghost_forcePushSum += amount;

        new ForcePush{ value: amount }(address(paymentProcessor));
    }

    function executeSingleERC721Sale(
        bool useBuyerAndSellerMultiSigs,
        bool marketplacePassthrough,
        bool payWithCoin,
        ActorKeys memory keys,
        FuzzedSaleInputs memory fuzzedSaleInputs) public {
    
        keys = _sanitizeKeys(keys);

        if (!useBuyerAndSellerMultiSigs && keys.shouldReturnEarly) {
            return;
        }

        fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(fuzzedSaleInputs, TokenProtocols.ERC721);

        (MatchedOrder memory saleDetails, SignatureECDSA memory signedListing, SignatureECDSA memory signedOffer) = 
            _getSaleDetailsAndSignatures(
                TokenProtocols.ERC721, 
                fuzzedSaleInputs,
                payWithCoin,
                keys.sellerKey, 
                keys.buyerKey, 
                useBuyerAndSellerMultiSigs ? address(sellerMultiSig): vm.addr(keys.sellerKey),
                useBuyerAndSellerMultiSigs ? address(buyerMultiSig) : vm.addr(keys.buyerKey),
                useBuyerAndSellerMultiSigs ? address(0) : vm.addr(keys.delegatedPurchaserKey),
                marketplacePassthrough);

        _mintAndDealTokensForSale(
            TokenProtocols.ERC721, 
            fuzzedSaleInputs.royaltyReceiverIndex == _royaltyReceivers.count() ? address(0) : _royaltyReceivers.at(fuzzedSaleInputs.royaltyReceiverIndex), 
            saleDetails);

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            signedListing, 
            signedOffer,
            marketplacePassthrough);

        _updateGhostState(marketplacePassthrough, fuzzedSaleInputs.royaltyReceiverIndex == _royaltyReceivers.count() ? address(0) : _royaltyReceivers.at(fuzzedSaleInputs.royaltyReceiverIndex), saleDetails);

        _updateBuyerERC721Balances(saleDetails.buyer);
        _updateERC20Balances(saleDetails.seller);
        _updateERC20Balances(saleDetails.marketplace);
        _updateERC20Balances(fuzzedSaleInputs.royaltyReceiverIndex == _royaltyReceivers.count() ? address(0) : _royaltyReceivers.at(fuzzedSaleInputs.royaltyReceiverIndex));
    }

    function executeSingleERC1155Sale(
        bool useBuyerAndSellerMultiSigs,
        bool marketplacePassthrough,
        bool payWithCoin,
        ActorKeys memory keys,
        FuzzedSaleInputs memory fuzzedSaleInputs) public {
    
        keys = _sanitizeKeys(keys);

        if (!useBuyerAndSellerMultiSigs && keys.shouldReturnEarly) {
            return;
        }

        fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(fuzzedSaleInputs, TokenProtocols.ERC1155);

        (MatchedOrder memory saleDetails, SignatureECDSA memory signedListing, SignatureECDSA memory signedOffer) = 
            _getSaleDetailsAndSignatures(
                TokenProtocols.ERC1155, 
                fuzzedSaleInputs,
                payWithCoin,
                keys.sellerKey, 
                keys.buyerKey, 
                useBuyerAndSellerMultiSigs ? address(sellerMultiSig): vm.addr(keys.sellerKey),
                useBuyerAndSellerMultiSigs ? address(buyerMultiSig) : vm.addr(keys.buyerKey),
                useBuyerAndSellerMultiSigs ? address(0) : vm.addr(keys.delegatedPurchaserKey),
                marketplacePassthrough);

        _mintAndDealTokensForSale(
            TokenProtocols.ERC1155, 
            fuzzedSaleInputs.royaltyReceiverIndex == _royaltyReceivers.count() ? address(0) : _royaltyReceivers.at(fuzzedSaleInputs.royaltyReceiverIndex), 
            saleDetails);

        _executeSingleSale(
            saleDetails.delegatedPurchaser != address(0) ? saleDetails.delegatedPurchaser : saleDetails.buyer, 
            saleDetails, 
            signedListing, 
            signedOffer,
            marketplacePassthrough);

        _updateGhostState(marketplacePassthrough, fuzzedSaleInputs.royaltyReceiverIndex == _royaltyReceivers.count() ? address(0) : _royaltyReceivers.at(fuzzedSaleInputs.royaltyReceiverIndex), saleDetails);

        _updateBuyerERC1155Balances(saleDetails.buyer);
        _updateERC20Balances(saleDetails.seller);
        _updateERC20Balances(saleDetails.marketplace);
        _updateERC20Balances(fuzzedSaleInputs.royaltyReceiverIndex == _royaltyReceivers.count() ? address(0) : _royaltyReceivers.at(fuzzedSaleInputs.royaltyReceiverIndex));
    }

    function executeBatchERC721Sale(
        bool useBuyerAndSellerMultiSigs,
        bool marketplacePassthrough,
        ActorKeys memory keys) public {
        keys = _sanitizeKeys(keys);

        if (keys.shouldReturnEarly) {
            return;
        }

        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](1 + _getRandInt(keys.sellerKey, 0, 4));
        SignatureECDSA[] memory signedListingsBatch = new SignatureECDSA[](saleDetailsBatch.length);
        SignatureECDSA[] memory signedOffersBatch = new SignatureECDSA[](saleDetailsBatch.length);

        for (uint256 i = 0; i < saleDetailsBatch.length; ++i) {
            FuzzedSaleInputs memory fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(_generateFuzzedSaleInputs(keys.sellerKey, i), TokenProtocols.ERC721);

            (saleDetailsBatch[i], signedListingsBatch[i], signedOffersBatch[i]) = 
                _getSaleDetailsAndSignatures(
                    TokenProtocols.ERC721, 
                    fuzzedSaleInputs,
                    _getRandInt(keys.sellerKey, 100000 + (100000 * i), 100) > 50,
                    keys.sellerKey, 
                    keys.buyerKey, 
                    useBuyerAndSellerMultiSigs ? address(sellerMultiSig) : vm.addr(keys.sellerKey),
                    useBuyerAndSellerMultiSigs ? address(buyerMultiSig) : vm.addr(keys.buyerKey),
                    address(0),
                    marketplacePassthrough);

            _mintAndDealTokensForSale(
                TokenProtocols.ERC721, 
                _royaltyReceivers.at(0), 
                saleDetailsBatch[i]);

            _updateGhostState(marketplacePassthrough, _royaltyReceivers.at(0), saleDetailsBatch[i]);
        }

        uint256 combinedNativePrice = _getCombinedNativePrice(saleDetailsBatch);

        deal(saleDetailsBatch[0].buyer, combinedNativePrice);

        _executeBatchSale(
            saleDetailsBatch[0].buyer, 
            saleDetailsBatch, 
            signedListingsBatch, 
            signedOffersBatch,
            marketplacePassthrough);

        _updateBuyerERC721Balances(saleDetailsBatch[0].buyer);

        _updateERC20Balances(saleDetailsBatch[0].seller);
        _updateERC20Balances(_royaltyReceivers.at(0));

        for (uint256 i = 0; i < saleDetailsBatch.length; ++i) {
            _updateERC20Balances(saleDetailsBatch[i].marketplace);
        }
    }

    function executeBatchERC1155Sale(
        bool useBuyerAndSellerMultiSigs,
        bool marketplacePassthrough,
        ActorKeys memory keys) public {
        keys = _sanitizeKeys(keys);

        if (keys.shouldReturnEarly) {
            return;
        }

        MatchedOrder[] memory saleDetailsBatch = new MatchedOrder[](1 + _getRandInt(keys.sellerKey, 0, 4));
        SignatureECDSA[] memory signedListingsBatch = new SignatureECDSA[](saleDetailsBatch.length);
        SignatureECDSA[] memory signedOffersBatch = new SignatureECDSA[](saleDetailsBatch.length);

        for (uint256 i = 0; i < saleDetailsBatch.length; ++i) { 
            FuzzedSaleInputs memory fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(_generateFuzzedSaleInputs(keys.sellerKey, i), TokenProtocols.ERC1155);

            (saleDetailsBatch[i], signedListingsBatch[i], signedOffersBatch[i]) = 
                _getSaleDetailsAndSignatures(
                    TokenProtocols.ERC1155, 
                    fuzzedSaleInputs,
                    _getRandInt(keys.sellerKey, 100000 + (100000 * i), 100) > 50,
                    keys.sellerKey, 
                    keys.buyerKey, 
                    useBuyerAndSellerMultiSigs ? address(sellerMultiSig) : vm.addr(keys.sellerKey),
                    useBuyerAndSellerMultiSigs ? address(buyerMultiSig) : vm.addr(keys.buyerKey),
                    address(0),
                    marketplacePassthrough);

            _mintAndDealTokensForSale(
                TokenProtocols.ERC1155, 
                _royaltyReceivers.at(0), 
                saleDetailsBatch[i]);

            _updateGhostState(marketplacePassthrough, _royaltyReceivers.at(0), saleDetailsBatch[i]);
        }

        uint256 combinedNativePrice = _getCombinedNativePrice(saleDetailsBatch);

        deal(saleDetailsBatch[0].buyer, combinedNativePrice);

        _executeBatchSale(
            saleDetailsBatch[0].buyer, 
            saleDetailsBatch, 
            signedListingsBatch, 
            signedOffersBatch,
            marketplacePassthrough);

        _updateBuyerERC1155Balances(saleDetailsBatch[0].buyer);

        _updateERC20Balances(saleDetailsBatch[0].seller);
        _updateERC20Balances(_royaltyReceivers.at(0));

        for (uint256 i = 0; i < saleDetailsBatch.length; ++i) {
            _updateERC20Balances(saleDetailsBatch[i].marketplace);
        }
    }

    function executeBundledERC721Sale(
        ActorKeys memory keys) public {
        keys = _sanitizeKeys(keys);

        if (keys.shouldReturnEarly) {
            return;
        }

        FuzzedSaleInputs memory fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(_generateFuzzedSaleInputs(keys.sellerKey, 1), TokenProtocols.ERC721);

        (MatchedOrderBundleExtended memory bundleDetails, BundledItem[] memory bundledItems, SignatureECDSA memory signedListing, SignatureECDSA memory signedOffer) = _getBundledSaleDetailsAndSignaturesERC721( 
            fuzzedSaleInputs,
            _getRandInt(keys.sellerKey, 100000 + (100000 * 1), 100) > 50,
            keys.sellerKey, 
            keys.buyerKey);

        deal(bundleDetails.bundleBase.buyer, bundleDetails.bundleBase.paymentCoin == address(0) ? bundleDetails.bundleBase.offerPrice : 0);

        vm.prank(bundleDetails.bundleBase.buyer);
        paymentProcessor.buyBundledListing(
            signedListing,
            signedOffer,
            bundleDetails,
            bundledItems);

        _updateBuyerERC721Balances(bundleDetails.bundleBase.buyer);
        _updateERC20Balances(bundleDetails.seller);
        _updateERC20Balances(_royaltyReceivers.at(0));
        _updateERC20Balances(bundleDetails.bundleBase.marketplace);
    }

    function executeBundledERC1155Sale(
        ActorKeys memory keys) public {
        keys = _sanitizeKeys(keys);

        if (keys.shouldReturnEarly) {
            return;
        }

        FuzzedSaleInputs memory fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(_generateFuzzedSaleInputs(keys.sellerKey, 1), TokenProtocols.ERC1155);

        (MatchedOrderBundleExtended memory bundleDetails, BundledItem[] memory bundledItems, SignatureECDSA memory signedListing, SignatureECDSA memory signedOffer) = _getBundledSaleDetailsAndSignaturesERC1155( 
            fuzzedSaleInputs,
            _getRandInt(keys.sellerKey, 100000 + (100000 * 1), 100) > 50,
            keys.sellerKey, 
            keys.buyerKey);

        deal(bundleDetails.bundleBase.buyer, bundleDetails.bundleBase.paymentCoin == address(0) ? bundleDetails.bundleBase.offerPrice : 0);

        vm.prank(bundleDetails.bundleBase.buyer);
        paymentProcessor.buyBundledListing(
            signedListing,
            signedOffer,
            bundleDetails,
            bundledItems);

        _updateBuyerERC1155Balances(bundleDetails.bundleBase.buyer);
        _updateERC20Balances(bundleDetails.seller);
        _updateERC20Balances(_royaltyReceivers.at(0));
        _updateERC20Balances(bundleDetails.bundleBase.marketplace);
    }

    function executeSweepCollectionERC721Sale(
        ActorKeys memory keys) public {
        keys = _sanitizeKeys(keys);

        if (keys.shouldReturnEarly) {
            return;
        }

        FuzzedSaleInputs memory fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(_generateFuzzedSaleInputs(keys.sellerKey, 1), TokenProtocols.ERC721);

        (MatchedOrderBundleExtended memory bundleDetails, BundledItem[] memory bundledItems, SignatureECDSA memory signedOffer, SignatureECDSA[] memory signedListings) = _getCollectionSweepSaleDetailsAndSignaturesERC721( 
            fuzzedSaleInputs,
            _getRandInt(keys.sellerKey, 100000 + (100000 * 1), 100) > 50,
            keys.sellerKey, 
            keys.buyerKey);

        deal(bundleDetails.bundleBase.buyer, bundleDetails.bundleBase.paymentCoin == address(0) ? bundleDetails.bundleBase.offerPrice : 0);

        vm.prank(bundleDetails.bundleBase.buyer);
        paymentProcessor.sweepCollection(
            signedOffer,
            bundleDetails.bundleBase,
            bundledItems,
            signedListings);

        _updateBuyerERC721Balances(bundleDetails.bundleBase.buyer);
        _updateERC20Balances(bundleDetails.seller);
        _updateERC20Balances(_royaltyReceivers.at(0));
        _updateERC20Balances(bundleDetails.bundleBase.marketplace);
    }

    function executeSweepCollectionERC1155Sale(
        ActorKeys memory keys) public {
        keys = _sanitizeKeys(keys);

        if (keys.shouldReturnEarly) {
            return;
        }

        FuzzedSaleInputs memory fuzzedSaleInputs = _sanitizeFuzzedSaleInputs(_generateFuzzedSaleInputs(keys.sellerKey, 1), TokenProtocols.ERC1155);

        (MatchedOrderBundleExtended memory bundleDetails, BundledItem[] memory bundledItems, SignatureECDSA memory signedOffer, SignatureECDSA[] memory signedListings) = _getCollectionSweepSaleDetailsAndSignaturesERC1155( 
            fuzzedSaleInputs,
            _getRandInt(keys.sellerKey, 100000 + (100000 * 1), 100) > 50,
            keys.sellerKey, 
            keys.buyerKey);

        deal(bundleDetails.bundleBase.buyer, bundleDetails.bundleBase.paymentCoin == address(0) ? bundleDetails.bundleBase.offerPrice : 0);

        vm.prank(bundleDetails.bundleBase.buyer);
        paymentProcessor.sweepCollection(
            signedOffer,
            bundleDetails.bundleBase,
            bundledItems,
            signedListings);

        _updateBuyerERC1155Balances(bundleDetails.bundleBase.buyer);
        _updateERC20Balances(bundleDetails.seller);
        _updateERC20Balances(_royaltyReceivers.at(0));
        _updateERC20Balances(bundleDetails.bundleBase.marketplace);
    }

    function _getCombinedNativePrice(MatchedOrder[] memory saleDetailsBatch) private pure returns (uint256) {
        uint256 nativePriceSum = 0;
        for (uint256 i = 0; i < saleDetailsBatch.length; ++i) {
            if(saleDetailsBatch[i].paymentCoin == address(0)) {
                nativePriceSum += saleDetailsBatch[i].offerPrice;
            }
        }
        return nativePriceSum;
    }

    function revokeNextListingNonce(uint256 sellerIndex, uint256 marketplaceIndex) public {
        if(_sellerActors.count() == 0) {
            return;
        }

        sellerIndex = bound(sellerIndex, 0, _sellerActors.count() - 1);
        marketplaceIndex = bound(marketplaceIndex, 0, _marketplaces.count() - 1);
        uint256 nonce = _nonces[_sellerActors.at(sellerIndex)];

        vm.prank(_sellerActors.at(sellerIndex));
        paymentProcessor.revokeSingleNonce(_marketplaces.at(marketplaceIndex), nonce);
    }

    function revokeAnyAvailableListingNonce(uint256 sellerIndex, uint256 marketplaceIndex, uint256 nonce) public {
        if(_sellerActors.count() == 0) {
            return;
        }

        sellerIndex = bound(sellerIndex, 0, _sellerActors.count() - 1);
        marketplaceIndex = bound(marketplaceIndex, 0, _marketplaces.count() - 1);
        nonce = bound(nonce, _nonces[_sellerActors.at(sellerIndex)], type(uint256).max);

        vm.prank(_sellerActors.at(sellerIndex));
        paymentProcessor.revokeSingleNonce(_marketplaces.at(marketplaceIndex), nonce);
    }

    function revokeNextOfferNonce(uint256 buyerIndex, uint256 marketplaceIndex) public {
        if(_buyerActors.count() == 0) {
            return;
        }

        buyerIndex = bound(buyerIndex, 0, _buyerActors.count() - 1);
        marketplaceIndex = bound(marketplaceIndex, 0, _marketplaces.count() - 1);
        uint256 nonce = _nonces[_buyerActors.at(buyerIndex)];

        vm.prank(_buyerActors.at(buyerIndex));
        paymentProcessor.revokeSingleNonce(_marketplaces.at(marketplaceIndex), nonce);
    }

    function revokeAnyAvailableOfferNonce(uint256 buyerIndex, uint256 marketplaceIndex, uint256 nonce) public {
        if(_buyerActors.count() == 0) {
            return;
        }

        buyerIndex = bound(buyerIndex, 0, _buyerActors.count() - 1);
        marketplaceIndex = bound(marketplaceIndex, 0, _marketplaces.count() - 1);
        nonce = bound(nonce, _nonces[_buyerActors.at(buyerIndex)], type(uint256).max);

        vm.prank(_buyerActors.at(buyerIndex));
        paymentProcessor.revokeSingleNonce(_marketplaces.at(marketplaceIndex), nonce);
    }

    function revokeSellerMasterNonce(uint256 sellerIndex) public {
        if(_sellerActors.count() == 0) {
            return;
        }

        sellerIndex = bound(sellerIndex, 0, _sellerActors.count() - 1);
        
        vm.prank(_sellerActors.at(sellerIndex));
        paymentProcessor.revokeMasterNonce();
    }

    function revokeBuyerMasterNonce(uint256 buyerIndex) public {
        if(_buyerActors.count() == 0) {
            return;
        }

        buyerIndex = bound(buyerIndex, 0, _buyerActors.count() - 1);
        
        vm.prank(_buyerActors.at(buyerIndex));
        paymentProcessor.revokeMasterNonce();
    }

    function setERC721CollectionSecurityPolicy(uint256 collectionIndex, uint256 securityPolicyIndex) public {
        collectionIndex = bound(collectionIndex, 0, _erc721Collections.count() - 1);
        securityPolicyIndex = bound(securityPolicyIndex, 0, _securityPolicies.length - 1);
        paymentProcessor.setCollectionSecurityPolicy(_erc721Collections.at(collectionIndex), _securityPolicies[securityPolicyIndex]);
    }

    function setERC1155CollectionSecurityPolicy(uint256 collectionIndex, uint256 securityPolicyIndex) public {
        collectionIndex = bound(collectionIndex, 0, _erc1155Collections.count() - 1);
        securityPolicyIndex = bound(securityPolicyIndex, 0, _securityPolicies.length - 1);
        paymentProcessor.setCollectionSecurityPolicy(_erc1155Collections.at(collectionIndex), _securityPolicies[securityPolicyIndex]);
    }

    function _sanitizeKeys(ActorKeys memory keys) private returns (ActorKeys memory) {

        keys.sellerKey = bound(keys.sellerKey, 1, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140);
        keys.buyerKey = bound(keys.buyerKey, 1, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140);
        keys.delegatedPurchaserKey = bound(keys.delegatedPurchaserKey, 1, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140);

        address seller = vm.addr(keys.sellerKey);
        address buyer = vm.addr(keys.buyerKey);
        address delegatedPurchaser = vm.addr(keys.delegatedPurchaserKey);

        if(seller == buyer ||
           seller == delegatedPurchaser ||
           _sellerActors.contains(buyer) ||
           _sellerActors.contains(delegatedPurchaser) ||
           _buyerActors.contains(seller)) {
            keys.shouldReturnEarly = true;
        } else {
            keys.shouldReturnEarly = false;
        }

        if(!keys.shouldReturnEarly) {
            _sellerActors.add(seller);
            _buyerActors.add(buyer);
        }

        return (keys);
    }

    function _generateFuzzedSaleInputs(uint256 seed, uint256 index) private view returns (FuzzedSaleInputs memory) {
        return FuzzedSaleInputs({
                paymentCoinIndex: _getRandInt(seed, 1 + (100 * index), _coins.count()),
                collectionIndex: _getRandInt(seed, 2 + (100 * index), _erc721Collections.count()),
                marketplaceIndex: _getRandInt(seed, 3 + (100 * index), _marketplaces.count()),
                marketplaceFee: _getRandInt(seed, 4 + (100 * index), 10000),
                royaltyReceiverIndex: _getRandInt(seed, 5 + (100 * index), _royaltyReceivers.count()),
                royaltyFee: _getRandInt(seed, 6 + (100 * index), 10000),
                price: _getRandInt(seed, 7 + (100 * index), 100 ether),
                amount: 1 + _getRandInt(seed, 8 + (100 * index), 1000000000),
                isPrivateSale: _getRandInt(seed, 9 + (100 * index), 1) == 1,
                isDelegatedPurchase: _getRandInt(seed, 10 + (100 * index), 1) == 1
            });
    }

    function _sanitizeFuzzedSaleInputs(FuzzedSaleInputs memory fuzzedSaleInputs, TokenProtocols tokenProtocol) private view returns (FuzzedSaleInputs memory) {
        fuzzedSaleInputs.paymentCoinIndex = bound(fuzzedSaleInputs.paymentCoinIndex, 0, _coins.count() - 1);
        fuzzedSaleInputs.collectionIndex = bound(fuzzedSaleInputs.collectionIndex, 0, _erc721Collections.count() - 1);
        fuzzedSaleInputs.marketplaceIndex = bound(fuzzedSaleInputs.marketplaceIndex, 0, _marketplaces.count());
        fuzzedSaleInputs.royaltyReceiverIndex = bound(fuzzedSaleInputs.royaltyReceiverIndex, 0, _royaltyReceivers.count());
        fuzzedSaleInputs.marketplaceFee = bound(fuzzedSaleInputs.marketplaceFee, 0, 10000);
        fuzzedSaleInputs.royaltyFee = bound(fuzzedSaleInputs.royaltyFee, 0, 10000 - fuzzedSaleInputs.marketplaceFee);
        fuzzedSaleInputs.price = bound(fuzzedSaleInputs.price, 0, 100 ether);

        if(tokenProtocol == TokenProtocols.ERC721) {
            fuzzedSaleInputs.amount = 1;
        } else if (tokenProtocol == TokenProtocols.ERC1155) {
            fuzzedSaleInputs.amount = bound(fuzzedSaleInputs.amount, 1, 1000000000);
        }

        return fuzzedSaleInputs;
    }

    function _getSaleDetailsAndSignatures(
        TokenProtocols tokenProtocol,
        FuzzedSaleInputs memory fuzzedSaleInputs,
        bool nativePayment,
        uint256 sellerKey, 
        uint256 buyerKey, 
        address seller,
        address buyer,
        address delegatedPurchaser,
        bool marketplacePassthrough) private returns (MatchedOrder memory, SignatureECDSA memory, SignatureECDSA memory) {
        MatchedOrder memory saleDetails = MatchedOrder({
            sellerAcceptedOffer: false,
collectionLevelOffer: false,
            protocol : tokenProtocol,
            paymentCoin: nativePayment ? address(0) : _coins.at(fuzzedSaleInputs.paymentCoinIndex),
            tokenAddress: address(0),
            seller: seller,
            privateBuyer: fuzzedSaleInputs.isPrivateSale ? buyer : address(0),
            buyer: buyer,
            delegatedPurchaser: fuzzedSaleInputs.isDelegatedPurchase ? delegatedPurchaser : address(0),
            marketplace: fuzzedSaleInputs.marketplaceIndex == _marketplaces.count() ? address(0) : _marketplaces.at(fuzzedSaleInputs.marketplaceIndex),
            marketplaceFeeNumerator: fuzzedSaleInputs.marketplaceFee,
            maxRoyaltyFeeNumerator: fuzzedSaleInputs.royaltyFee,
            listingNonce: _getNextNonce(seller),
            offerNonce: _getNextNonce(buyer),
            listingMinPrice: fuzzedSaleInputs.price,
            offerPrice: fuzzedSaleInputs.price,
            listingExpiration: type(uint256).max,
            offerExpiration: type(uint256).max,
            tokenId: 0,
            amount: fuzzedSaleInputs.amount
        });

        if (tokenProtocol == TokenProtocols.ERC721) {
            saleDetails.tokenAddress = _erc721Collections.at(fuzzedSaleInputs.collectionIndex);
        } else if (tokenProtocol == TokenProtocols.ERC1155) {
            saleDetails.tokenAddress = _erc1155Collections.at(fuzzedSaleInputs.collectionIndex);
        }

        saleDetails.tokenId = _getNextAvailableTokenId(saleDetails.tokenAddress);

        if(marketplacePassthrough && saleDetails.marketplace == address(0)) {
            saleDetails.marketplace = _marketplaces.at(0);
            saleDetails.delegatedPurchaser = address(0);
        }

        return ( saleDetails, getSignedListing(sellerKey, saleDetails), getSignedOffer(buyerKey, saleDetails));
    }

    function _getBundledSaleDetailsAndSignaturesERC721(
        FuzzedSaleInputs memory fuzzedSaleInputs,
        bool nativePayment,
        uint256 sellerKey, 
        uint256 buyerKey) private returns (MatchedOrderBundleExtended memory, BundledItem[] memory, SignatureECDSA memory, SignatureECDSA memory) {

        uint256 numItemsInBundle = 1 + _getRandInt(sellerKey, 0, 4);

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: nativePayment ? address(0) : _coins.at(fuzzedSaleInputs.paymentCoinIndex),
            tokenAddress: _erc721Collections.at(fuzzedSaleInputs.collectionIndex),
            privateBuyer: fuzzedSaleInputs.isPrivateSale ? vm.addr(buyerKey) : address(0),
            buyer: vm.addr(buyerKey),
            delegatedPurchaser: address(0),
            marketplace: fuzzedSaleInputs.marketplaceIndex == _marketplaces.count() ? address(0) : _marketplaces.at(fuzzedSaleInputs.marketplaceIndex),
            marketplaceFeeNumerator: fuzzedSaleInputs.marketplaceFee,
            offerNonce: _getNextNonce(vm.addr(buyerKey)),
            offerPrice: fuzzedSaleInputs.price * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: vm.addr(sellerKey),
            listingNonce: _getNextNonce(vm.addr(sellerKey)),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledItems = new BundledItem[](numItemsInBundle);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](numItemsInBundle),
            amounts: new uint256[](numItemsInBundle),
            salePrices: new uint256[](numItemsInBundle),
            maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
            sellers: new address[](numItemsInBundle),
            sumListingPrices: 0
        });

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledItems[i].tokenId = _getNextAvailableTokenId(bundledOfferDetails.tokenAddress);
            bundledItems[i].amount = fuzzedSaleInputs.amount;
            bundledItems[i].maxRoyaltyFeeNumerator = fuzzedSaleInputs.royaltyFee;
            bundledItems[i].itemPrice = fuzzedSaleInputs.price;
            bundledItems[i].listingNonce = _getNextNonce(vm.addr(sellerKey));
            bundledItems[i].listingExpiration = type(uint256).max;
            bundledItems[i].seller = vm.addr(sellerKey);

            accumulator.tokenIds[i] = bundledItems[i].tokenId;
            accumulator.amounts[i] = bundledItems[i].amount;
            accumulator.salePrices[i] = bundledItems[i].itemPrice;
            accumulator.maxRoyaltyFeeNumerators[i] = bundledItems[i].maxRoyaltyFeeNumerator;
            accumulator.sellers[i] = bundledItems[i].seller;
            accumulator.sumListingPrices += bundledItems[i].itemPrice;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledItems[i].itemPrice,
                    offerPrice: bundledItems[i].itemPrice,
                    listingExpiration: bundledItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledItems[i].tokenId,
                    amount: bundledItems[i].amount
                });

            _mintAndDealTokensForSale(saleDetails.protocol, _royaltyReceivers.at(0), saleDetails);

            _updateGhostState(false, _royaltyReceivers.at(0), saleDetails);
        }

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        return ( 
            bundleOfferDetailsExtended,
            bundledItems, 
            getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            getSignedBundledOffer(buyerKey, bundledOfferDetails, bundledItems));
    }

    function _getCollectionSweepSaleDetailsAndSignaturesERC721(
        FuzzedSaleInputs memory fuzzedSaleInputs,
        bool nativePayment,
        uint256 sellerKey, 
        uint256 buyerKey) private returns (MatchedOrderBundleExtended memory, BundledItem[] memory, SignatureECDSA memory, SignatureECDSA[] memory) {

        uint256 numItemsInBundle = 1 + _getRandInt(sellerKey, 0, 4);

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC721,
            paymentCoin: nativePayment ? address(0) : _coins.at(fuzzedSaleInputs.paymentCoinIndex),
            tokenAddress: _erc721Collections.at(fuzzedSaleInputs.collectionIndex),
            privateBuyer: fuzzedSaleInputs.isPrivateSale ? vm.addr(buyerKey) : address(0),
            buyer: vm.addr(buyerKey),
            delegatedPurchaser: address(0),
            marketplace: fuzzedSaleInputs.marketplaceIndex == _marketplaces.count() ? address(0) : _marketplaces.at(fuzzedSaleInputs.marketplaceIndex),
            marketplaceFeeNumerator: fuzzedSaleInputs.marketplaceFee,
            offerNonce: _getNextNonce(vm.addr(buyerKey)),
            offerPrice: fuzzedSaleInputs.price * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: vm.addr(sellerKey),
            listingNonce: _getNextNonce(vm.addr(sellerKey)),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](numItemsInBundle),
            amounts: new uint256[](numItemsInBundle),
            salePrices: new uint256[](numItemsInBundle),
            maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
            sellers: new address[](numItemsInBundle),
            sumListingPrices: 0
        });

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledItems[i].tokenId = _getNextAvailableTokenId(bundledOfferDetails.tokenAddress);
            bundledItems[i].amount = fuzzedSaleInputs.amount;
            bundledItems[i].maxRoyaltyFeeNumerator = fuzzedSaleInputs.royaltyFee;
            bundledItems[i].itemPrice = fuzzedSaleInputs.price;
            bundledItems[i].listingNonce = _getNextNonce(vm.addr(sellerKey));
            bundledItems[i].listingExpiration = type(uint256).max;
            bundledItems[i].seller = vm.addr(sellerKey);

            accumulator.tokenIds[i] = bundledItems[i].tokenId;
            accumulator.amounts[i] = bundledItems[i].amount;
            accumulator.salePrices[i] = bundledItems[i].itemPrice;
            accumulator.maxRoyaltyFeeNumerators[i] = bundledItems[i].maxRoyaltyFeeNumerator;
            accumulator.sellers[i] = bundledItems[i].seller;
            accumulator.sumListingPrices += bundledItems[i].itemPrice;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledItems[i].itemPrice,
                    offerPrice: bundledItems[i].itemPrice,
                    listingExpiration: bundledItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledItems[i].tokenId,
                    amount: bundledItems[i].amount
                });

            signedListings[i] = getSignedListing(sellerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, _royaltyReceivers.at(0), saleDetails);

            _updateGhostState(false, _royaltyReceivers.at(0), saleDetails);
        }

        return ( 
            bundleOfferDetailsExtended,
            bundledItems, 
            getSignedBundledOffer(buyerKey, bundledOfferDetails, bundledItems),
            signedListings);
    }

    function _getBundledSaleDetailsAndSignaturesERC1155(
        FuzzedSaleInputs memory fuzzedSaleInputs,
        bool nativePayment,
        uint256 sellerKey, 
        uint256 buyerKey) private returns (MatchedOrderBundleExtended memory, BundledItem[] memory, SignatureECDSA memory, SignatureECDSA memory) {

        uint256 numItemsInBundle = 1 + _getRandInt(sellerKey, 0, 4);

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC1155,
            paymentCoin: nativePayment ? address(0) : _coins.at(fuzzedSaleInputs.paymentCoinIndex),
            tokenAddress: _erc1155Collections.at(fuzzedSaleInputs.collectionIndex),
            privateBuyer: fuzzedSaleInputs.isPrivateSale ? vm.addr(buyerKey) : address(0),
            buyer: vm.addr(buyerKey),
            delegatedPurchaser: address(0),
            marketplace: fuzzedSaleInputs.marketplaceIndex == _marketplaces.count() ? address(0) : _marketplaces.at(fuzzedSaleInputs.marketplaceIndex),
            marketplaceFeeNumerator: fuzzedSaleInputs.marketplaceFee,
            offerNonce: _getNextNonce(vm.addr(buyerKey)),
            offerPrice: fuzzedSaleInputs.price * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: vm.addr(sellerKey),
            listingNonce: _getNextNonce(vm.addr(sellerKey)),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledItems = new BundledItem[](numItemsInBundle);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](numItemsInBundle),
            amounts: new uint256[](numItemsInBundle),
            salePrices: new uint256[](numItemsInBundle),
            maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
            sellers: new address[](numItemsInBundle),
            sumListingPrices: 0
        });

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledItems[i].tokenId = _getNextAvailableTokenId(bundledOfferDetails.tokenAddress);
            bundledItems[i].amount = fuzzedSaleInputs.amount;
            bundledItems[i].maxRoyaltyFeeNumerator = fuzzedSaleInputs.royaltyFee;
            bundledItems[i].itemPrice = fuzzedSaleInputs.price;
            bundledItems[i].listingNonce = _getNextNonce(vm.addr(sellerKey));
            bundledItems[i].listingExpiration = type(uint256).max;
            bundledItems[i].seller = vm.addr(sellerKey);

            accumulator.tokenIds[i] = bundledItems[i].tokenId;
            accumulator.amounts[i] = bundledItems[i].amount;
            accumulator.salePrices[i] = bundledItems[i].itemPrice;
            accumulator.maxRoyaltyFeeNumerators[i] = bundledItems[i].maxRoyaltyFeeNumerator;
            accumulator.sellers[i] = bundledItems[i].seller;
            accumulator.sumListingPrices += bundledItems[i].itemPrice;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledItems[i].itemPrice,
                    offerPrice: bundledItems[i].itemPrice,
                    listingExpiration: bundledItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledItems[i].tokenId,
                    amount: bundledItems[i].amount
                });

            _mintAndDealTokensForSale(saleDetails.protocol, _royaltyReceivers.at(0), saleDetails);

            _updateGhostState(false, _royaltyReceivers.at(0), saleDetails);
        }

        AccumulatorHashes memory accumulatorHashes = 
            AccumulatorHashes({
                tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
            });

        return ( 
            bundleOfferDetailsExtended,
            bundledItems, 
            getSignedBundledListing(sellerKey, accumulatorHashes, bundleOfferDetailsExtended),
            getSignedBundledOffer(buyerKey, bundledOfferDetails, bundledItems));
    }

    function _getCollectionSweepSaleDetailsAndSignaturesERC1155(
        FuzzedSaleInputs memory fuzzedSaleInputs,
        bool nativePayment,
        uint256 sellerKey, 
        uint256 buyerKey) private returns (MatchedOrderBundleExtended memory, BundledItem[] memory, SignatureECDSA memory, SignatureECDSA[] memory) {

        uint256 numItemsInBundle = 1 + _getRandInt(sellerKey, 0, 4);

        MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
            protocol: TokenProtocols.ERC1155,
            paymentCoin: nativePayment ? address(0) : _coins.at(fuzzedSaleInputs.paymentCoinIndex),
            tokenAddress: _erc1155Collections.at(fuzzedSaleInputs.collectionIndex),
            privateBuyer: fuzzedSaleInputs.isPrivateSale ? vm.addr(buyerKey) : address(0),
            buyer: vm.addr(buyerKey),
            delegatedPurchaser: address(0),
            marketplace: fuzzedSaleInputs.marketplaceIndex == _marketplaces.count() ? address(0) : _marketplaces.at(fuzzedSaleInputs.marketplaceIndex),
            marketplaceFeeNumerator: fuzzedSaleInputs.marketplaceFee,
            offerNonce: _getNextNonce(vm.addr(buyerKey)),
            offerPrice: fuzzedSaleInputs.price * numItemsInBundle,
            offerExpiration: type(uint256).max
        });

        MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
            bundleBase: bundledOfferDetails,
            seller: vm.addr(sellerKey),
            listingNonce: _getNextNonce(vm.addr(sellerKey)),
            listingExpiration: type(uint256).max
        });

        BundledItem[] memory bundledItems = new BundledItem[](numItemsInBundle);
        SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);

        Accumulator memory accumulator = Accumulator({
            tokenIds: new uint256[](numItemsInBundle),
            amounts: new uint256[](numItemsInBundle),
            salePrices: new uint256[](numItemsInBundle),
            maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
            sellers: new address[](numItemsInBundle),
            sumListingPrices: 0
        });

        for (uint256 i = 0; i < numItemsInBundle; ++i) {
            bundledItems[i].tokenId = _getNextAvailableTokenId(bundledOfferDetails.tokenAddress);
            bundledItems[i].amount = fuzzedSaleInputs.amount;
            bundledItems[i].maxRoyaltyFeeNumerator = fuzzedSaleInputs.royaltyFee;
            bundledItems[i].itemPrice = fuzzedSaleInputs.price;
            bundledItems[i].listingNonce = _getNextNonce(vm.addr(sellerKey));
            bundledItems[i].listingExpiration = type(uint256).max;
            bundledItems[i].seller = vm.addr(sellerKey);

            accumulator.tokenIds[i] = bundledItems[i].tokenId;
            accumulator.amounts[i] = bundledItems[i].amount;
            accumulator.salePrices[i] = bundledItems[i].itemPrice;
            accumulator.maxRoyaltyFeeNumerators[i] = bundledItems[i].maxRoyaltyFeeNumerator;
            accumulator.sellers[i] = bundledItems[i].seller;
            accumulator.sumListingPrices += bundledItems[i].itemPrice;

            MatchedOrder memory saleDetails = 
                MatchedOrder({
                    sellerAcceptedOffer: false,
                    collectionLevelOffer: false,
                    protocol: bundledOfferDetails.protocol,
                    paymentCoin: bundledOfferDetails.paymentCoin,
                    tokenAddress: bundledOfferDetails.tokenAddress,
                    seller: bundledItems[i].seller,
                    privateBuyer: bundledOfferDetails.privateBuyer,
                    buyer: bundledOfferDetails.buyer,
                    delegatedPurchaser: bundledOfferDetails.delegatedPurchaser,
                    marketplace: bundledOfferDetails.marketplace,
                    marketplaceFeeNumerator: bundledOfferDetails.marketplaceFeeNumerator,
                    maxRoyaltyFeeNumerator: bundledItems[i].maxRoyaltyFeeNumerator,
                    listingNonce: bundledItems[i].listingNonce,
                    offerNonce: bundledOfferDetails.offerNonce,
                    listingMinPrice: bundledItems[i].itemPrice,
                    offerPrice: bundledItems[i].itemPrice,
                    listingExpiration: bundledItems[i].listingExpiration,
                    offerExpiration: bundledOfferDetails.offerExpiration,
                    tokenId: bundledItems[i].tokenId,
                    amount: bundledItems[i].amount
                });

            signedListings[i] = getSignedListing(sellerKey, saleDetails);

            _mintAndDealTokensForSale(saleDetails.protocol, _royaltyReceivers.at(0), saleDetails);

            _updateGhostState(false, _royaltyReceivers.at(0), saleDetails);
        }

        return ( 
            bundleOfferDetailsExtended,
            bundledItems, 
            getSignedBundledOffer(buyerKey, bundledOfferDetails, bundledItems),
            signedListings);
    }

    function _mintAndDealTokensForSale(TokenProtocols tokenProtocol, address royaltyReceiver, MatchedOrder memory saleDetails) private {
        address purchaser = saleDetails.delegatedPurchaser == address(0) ? saleDetails.buyer : saleDetails.delegatedPurchaser;
        if(saleDetails.paymentCoin == address(0)) {
            deal(purchaser, saleDetails.offerPrice);
        } else {

            uint256 currentAllowance = ERC20Mock(saleDetails.paymentCoin).allowance(purchaser, address(paymentProcessor));
            uint256 newAllowance = currentAllowance + saleDetails.offerPrice;

            ERC20Mock(saleDetails.paymentCoin).mint(purchaser, saleDetails.offerPrice);

            if(purchaser == address(buyerMultiSig)) {
                buyerMultiSig.approve(saleDetails.paymentCoin, address(paymentProcessor), newAllowance);
            } else {
                vm.prank(purchaser);
                ERC20Mock(saleDetails.paymentCoin).approve(address(paymentProcessor), newAllowance);
            }
        }

        if (tokenProtocol == TokenProtocols.ERC721) {

            ERC721Mock(saleDetails.tokenAddress).setTokenRoyalty(
            saleDetails.tokenId, 
            royaltyReceiver,
            uint96(saleDetails.maxRoyaltyFeeNumerator));

            ERC721Mock(saleDetails.tokenAddress).mintTo(saleDetails.seller, saleDetails.tokenId);
            
            if(saleDetails.seller == address(sellerMultiSig)) {
                sellerMultiSig.setApprovalForAll(TokenProtocols.ERC721, saleDetails.tokenAddress, address(paymentProcessor), true);
            } else {
                vm.prank(saleDetails.seller);
                IERC721(saleDetails.tokenAddress).setApprovalForAll(address(paymentProcessor), true);
            }
        } else if (tokenProtocol == TokenProtocols.ERC1155) {

            ERC1155Mock(saleDetails.tokenAddress).setTokenRoyalty(
            saleDetails.tokenId, 
            royaltyReceiver,
            uint96(saleDetails.maxRoyaltyFeeNumerator));

            ERC1155Mock(saleDetails.tokenAddress).mintTo(saleDetails.seller, saleDetails.tokenId, saleDetails.amount);

            if(saleDetails.seller == address(sellerMultiSig)) {
                sellerMultiSig.setApprovalForAll(TokenProtocols.ERC1155, saleDetails.tokenAddress, address(paymentProcessor), true);
            } else {
                vm.prank(saleDetails.seller);
                IERC1155(saleDetails.tokenAddress).setApprovalForAll(address(paymentProcessor), true);
            }
        }
    }

    function _updateGhostState(bool marketplacePassthrough, address royaltyReceiver, MatchedOrder memory saleDetails) private {

        _updateExpectedSumOfProceeds(
            saleDetails.paymentCoin == address(0),
            saleDetails.offerPrice, 
            saleDetails.seller, 
            royaltyReceiver, 
            saleDetails.maxRoyaltyFeeNumerator, 
            saleDetails.marketplace, 
            saleDetails.marketplaceFeeNumerator);
        
        if (saleDetails.protocol == TokenProtocols.ERC721) {
            if (marketplacePassthrough) {
                ghost_numberOfERC721SalesViaPassthroughMarketplaces++;
            }

            ghost_sumOfERC721TokensSold += 1;
        } else if(saleDetails.protocol == TokenProtocols.ERC1155) {
            if (marketplacePassthrough) {
                ghost_numberOfERC1155SalesViaPassthroughMarketplaces++;
            }

            ghost_sumOfERC1155TokensSold += saleDetails.amount;
        }
    }

    function _updateBuyerERC721Balances(address buyer) private {
        ghost_expectedERC721Balances[buyer] = 0;

        for (uint256 i = 0; i < _erc721Collections.count(); ++i) {
            ghost_expectedERC721Balances[buyer] += IERC721(_erc721Collections.at(i)).balanceOf(buyer);
        }
    }

    function _updateBuyerERC1155Balances(address buyer) private {
        ghost_expectedERC1155Balances[buyer] = 0;

        for (uint256 i = 0; i < _erc1155Collections.count(); ++i) {
            for (uint256 typeId = 0; typeId < _nextAvailableTokenId[_erc1155Collections.at(i)]; ++typeId) {
                ghost_expectedERC1155Balances[buyer] += IERC1155(_erc1155Collections.at(i)).balanceOf(buyer, typeId);
            }
        }
    }

    function _updateERC20Balances(address account) private {
        if(account != address(0)) {
            ghost_expectedERC20Balances[account] = 0;
        }
        
        for (uint256 coinIndex = 0; coinIndex < _coins.count(); coinIndex++) {
            IERC20 coin = IERC20(_coins.at(coinIndex));

            if(account != address(0)) {
                ghost_expectedERC20Balances[account] += coin.balanceOf(account);
            }
        }
    }

    function _executeSingleSale(
        address purchaser,
        MatchedOrder memory saleDetails,
        SignatureECDSA memory signedListing,
        SignatureECDSA memory signedOffer,
        bool marketplacePassthrough) private {
        
        uint256 msgValue = saleDetails.paymentCoin == address(0) ? saleDetails.offerPrice : 0;

        if(purchaser == address(buyerMultiSig)) {
            if(saleDetails.paymentCoin == address(0)) {
                buyerMultiSig.buySingleListing(address(paymentProcessor), saleDetails, signedListing, signedOffer);
            } else {
                buyerMultiSig.buySingleListingCoin(address(paymentProcessor), saleDetails, signedListing, signedOffer);
            }
        } else {
            if (marketplacePassthrough) {
                vm.prank(purchaser);
                MarketplaceMock(payable(saleDetails.marketplace)).buySingleListing{value: msgValue}(
                    saleDetails, 
                    signedListing,
                    signedOffer);
            } else {
                vm.prank(purchaser, purchaser);
                paymentProcessor.buySingleListing{value: msgValue}(saleDetails, signedListing, signedOffer);
            }
        }
    }

    function _executeBatchSale(
        address purchaser,
        MatchedOrder[] memory saleDetailsBatch,
        SignatureECDSA[] memory signedListingsBatch,
        SignatureECDSA[] memory signedOffersBatch,
        bool marketplacePassthrough) private {
        
        uint256 msgValue = _getCombinedNativePrice(saleDetailsBatch);

        if(purchaser == address(buyerMultiSig)) {
            buyerMultiSig.buyBatchOfListings(address(paymentProcessor), saleDetailsBatch, signedListingsBatch, signedOffersBatch);
        } else {
            if (marketplacePassthrough) {
                vm.prank(purchaser);
                MarketplaceMock(payable(saleDetailsBatch[0].marketplace)).buyBatchOfListings{value: msgValue}(
                    saleDetailsBatch, 
                    signedListingsBatch,
                    signedOffersBatch);
            } else {
                vm.prank(purchaser, purchaser);
                paymentProcessor.buyBatchOfListings{value: msgValue}(saleDetailsBatch, signedListingsBatch, signedOffersBatch);
            }
        }
    }

    function getSignedListing(uint256 sellerKey, MatchedOrder memory saleDetails) private view returns (SignatureECDSA memory) {
        bytes32 listingDigest = 
            ECDSA.toTypedDataHash(
                paymentProcessor.getDomainSeparator(), 
                keccak256(
                    bytes.concat(
                        abi.encode(
                            paymentProcessor.SALE_APPROVAL_HASH(),
                            uint8(saleDetails.protocol),
                            saleDetails.sellerAcceptedOffer,
                            saleDetails.marketplace,
                            saleDetails.marketplaceFeeNumerator,
                            saleDetails.maxRoyaltyFeeNumerator,
                            saleDetails.privateBuyer,
                            saleDetails.seller,
                            saleDetails.tokenAddress,
                            saleDetails.tokenId
                        ),
                        abi.encode(
                            saleDetails.amount,
                            saleDetails.listingMinPrice,
                            saleDetails.listingExpiration,
                            saleDetails.listingNonce,
                            paymentProcessor.masterNonces(saleDetails.seller),
                            saleDetails.paymentCoin
                        )
                    )
                )
            );

        (uint8 listingV, bytes32 listingR, bytes32 listingS) = vm.sign(sellerKey, listingDigest);
        SignatureECDSA memory signedListing = SignatureECDSA({v: listingV, r: listingR, s: listingS});

        return signedListing;
    }

    function getSignedBundledListing(
        uint256 sellerKey, 
        AccumulatorHashes memory accumulatorHashes,
        MatchedOrderBundleExtended memory bundleDetails) internal view returns (SignatureECDSA memory) {
        bytes32 listingDigest = 
            ECDSA.toTypedDataHash(
                paymentProcessor.getDomainSeparator(), 
                keccak256(
                    bytes.concat(
                        abi.encode(
                            paymentProcessor.BUNDLED_SALE_APPROVAL_HASH(),
                            uint8(bundleDetails.bundleBase.protocol),
                            bundleDetails.bundleBase.marketplace,
                            bundleDetails.bundleBase.marketplaceFeeNumerator,
                            bundleDetails.bundleBase.privateBuyer,
                            bundleDetails.seller,
                            bundleDetails.bundleBase.tokenAddress
                        ),
                        abi.encode(
                            bundleDetails.listingExpiration,
                            bundleDetails.listingNonce,
                            paymentProcessor.masterNonces(bundleDetails.seller),
                            bundleDetails.bundleBase.paymentCoin,
                            accumulatorHashes.tokenIdsKeccakHash,
                            accumulatorHashes.amountsKeccakHash,
                            accumulatorHashes.maxRoyaltyFeeNumeratorsKeccakHash,
                            accumulatorHashes.itemPricesKeccakHash
                        )
                    )
                )
            );

        (uint8 listingV, bytes32 listingR, bytes32 listingS) = vm.sign(sellerKey, listingDigest);
        SignatureECDSA memory signedListing = SignatureECDSA({v: listingV, r: listingR, s: listingS});

        return signedListing;
    }

    function getSignedOffer(uint256 buyerKey, MatchedOrder memory saleDetails) private view returns (SignatureECDSA memory) {
        bytes32 offerDigest = 
            ECDSA.toTypedDataHash(
                paymentProcessor.getDomainSeparator(), 
                keccak256(
                    bytes.concat(
                        abi.encode(
                            paymentProcessor.OFFER_APPROVAL_HASH(),
                            uint8(saleDetails.protocol),
                            saleDetails.marketplace,
                            saleDetails.marketplaceFeeNumerator,
                            saleDetails.delegatedPurchaser,
                            saleDetails.buyer,
                            saleDetails.tokenAddress,
                            saleDetails.tokenId,
                            saleDetails.amount,
                            saleDetails.offerPrice
                        ),
                        abi.encode(
                            saleDetails.offerExpiration,
                            saleDetails.offerNonce,
                            paymentProcessor.masterNonces(saleDetails.buyer),
                            saleDetails.paymentCoin
                        )
                    )
                )
            );

        (uint8 offerV, bytes32 offerR, bytes32 offerS) = vm.sign(buyerKey, offerDigest);
        SignatureECDSA memory signedOffer = SignatureECDSA({v: offerV, r: offerR, s: offerS});

        return signedOffer;
    }

    function getSignedCollectionOffer(uint256 buyerKey, MatchedOrder memory saleDetails) private view returns (SignatureECDSA memory) {
        bytes32 offerDigest = 
            ECDSA.toTypedDataHash(
                paymentProcessor.getDomainSeparator(), 
                keccak256(
                    bytes.concat(
                        abi.encode(
                            paymentProcessor.COLLECTION_OFFER_APPROVAL_HASH(),
                            uint8(saleDetails.protocol),
                            saleDetails.collectionLevelOffer,
                            saleDetails.marketplace,
                            saleDetails.marketplaceFeeNumerator,
                            saleDetails.delegatedPurchaser,
                            saleDetails.buyer,
                            saleDetails.tokenAddress,
                            saleDetails.amount,
                            saleDetails.offerPrice
                        ),
                        abi.encode(
                            saleDetails.offerExpiration,
                            saleDetails.offerNonce,
                            paymentProcessor.masterNonces(saleDetails.buyer),
                            saleDetails.paymentCoin
                        )
                    )
                )
            );

        (uint8 offerV, bytes32 offerR, bytes32 offerS) = vm.sign(buyerKey, offerDigest);
        SignatureECDSA memory signedOffer = SignatureECDSA({v: offerV, r: offerR, s: offerS});

        return signedOffer;
    }

    function getSignedBundledOffer(
        uint256 buyerKey, 
        MatchedOrderBundleBase memory bundledOfferDetails,
        BundledItem[] memory bundledOfferItems) internal view returns (SignatureECDSA memory) {

        uint256[] memory tokenIds = new uint256[](bundledOfferItems.length);
        uint256[] memory amounts = new uint256[](bundledOfferItems.length);
        uint256[] memory itemPrices = new uint256[](bundledOfferItems.length);
        for (uint256 i = 0; i < bundledOfferItems.length; ++i) {
            tokenIds[i] = bundledOfferItems[i].tokenId;
            amounts[i] = bundledOfferItems[i].amount;
            itemPrices[i] = bundledOfferItems[i].itemPrice;
        }
        
        bytes32 offerDigest = 
            ECDSA.toTypedDataHash(
                paymentProcessor.getDomainSeparator(), 
                keccak256(
                    bytes.concat(
                        abi.encode(
                            paymentProcessor.BUNDLED_OFFER_APPROVAL_HASH(),
                            uint8(bundledOfferDetails.protocol),
                            bundledOfferDetails.marketplace,
                            bundledOfferDetails.marketplaceFeeNumerator,
                            bundledOfferDetails.delegatedPurchaser,
                            bundledOfferDetails.buyer,
                            bundledOfferDetails.tokenAddress,
                            bundledOfferDetails.offerPrice
                        ),
                        abi.encode(
                            bundledOfferDetails.offerExpiration,
                            bundledOfferDetails.offerNonce,
                            paymentProcessor.masterNonces(bundledOfferDetails.buyer),
                            bundledOfferDetails.paymentCoin,
                            keccak256(abi.encodePacked(tokenIds)),
                            keccak256(abi.encodePacked(amounts)),
                            keccak256(abi.encodePacked(itemPrices))
                        )
                    )
                )
            );

        (uint8 offerV, bytes32 offerR, bytes32 offerS) = vm.sign(buyerKey, offerDigest);
        SignatureECDSA memory signedOffer = SignatureECDSA({v: offerV, r: offerR, s: offerS});

        return signedOffer;
    }

    function _updateExpectedSumOfProceeds(
        bool paidWithEther,
        uint256 price, 
        address seller,
        address royaltyReceiver,
        uint256 royaltyFee,
        address marketplaceAddress,
        uint256 marketplaceFee) private {

        uint256 expectedRoyaltyProceeds = royaltyReceiver == address(0) ? 0 : (price * royaltyFee / 10000);
        uint256 expectedMarketplaceProceeds = marketplaceAddress == address(0) ? 0 : (price * marketplaceFee / 10000);
        uint256 expectedSellerProceeds = price - expectedRoyaltyProceeds - expectedMarketplaceProceeds;

        if (paidWithEther) {
            ghost_sumOfPurchasePriceNative += price;

            ghost_expectedSumOfEtherProceeds[royaltyReceiver] += expectedRoyaltyProceeds;
            ghost_expectedSumOfEtherProceeds[marketplaceAddress] += expectedMarketplaceProceeds;
            ghost_expectedSumOfEtherProceeds[seller] += expectedSellerProceeds;
        } else {
            ghost_sumOfPurchasePriceCoins += price;

            ghost_expectedSumOfCoinProceeds[royaltyReceiver] += expectedRoyaltyProceeds;
            ghost_expectedSumOfCoinProceeds[marketplaceAddress] += expectedMarketplaceProceeds;
            ghost_expectedSumOfCoinProceeds[seller] += expectedSellerProceeds;
        }
    }

    function _getNextNonce(address account) private returns (uint256) {
        uint256 nextUnusedNonce = _nonces[account];
        ++_nonces[account];
        return nextUnusedNonce;
    }

    function _getNextAvailableTokenId(address collection) private returns (uint256) {
        uint256 nextTokenId = _nextAvailableTokenId[collection];
        ++_nextAvailableTokenId[collection];
        return nextTokenId;
    }

    function _getRandInt(uint256 seed, uint256 index, uint256 max) private pure returns (uint256) {
        uint256 result = uint256(keccak256(abi.encodePacked(seed, index)));
        result = result % max;
        return result;
    }

    function forEachSellerActor(function(address) external returns (address[] memory) func) public {
        return _sellerActors.forEach(func);
    }

    function reduceSellerActors(uint256 acc, function(uint256,address) external returns (uint256) func) public returns (uint256) {
        return _sellerActors.reduce(acc, func);
    }

    function forEachBuyerActor(function(address) external returns (address[] memory) func) public {
        return _buyerActors.forEach(func);
    }

    function reduceBuyerActors(uint256 acc, function(uint256,address) external returns (uint256) func) public returns (uint256) {
        return _buyerActors.reduce(acc, func);
    }

    function forEachMarketplaceActor(function(address) external returns (address[] memory) func) public {
        return _marketplaces.forEach(func);
    }

    function reduceMarketplaceActors(uint256 acc, function(uint256,address) external returns (uint256) func) public returns (uint256) {
        return _marketplaces.reduce(acc, func);
    }

    function forEachRoyaltyReceiverActor(function(address) external returns (address[] memory) func) public {
        return _royaltyReceivers.forEach(func);
    }

    function reduceRoyaltyReceiverActors(uint256 acc, function(uint256,address) external returns (uint256) func) public returns (uint256) {
        return _royaltyReceivers.reduce(acc, func);
    }
}