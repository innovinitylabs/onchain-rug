pragma solidity 0.8.9;

import "forge-std/Test.sol";
import "contracts/PaymentProcessor.sol";

import "../mocks/ERC20Mock.sol";
import "../mocks/ERC721Mock.sol";
import "../mocks/ERC1155Mock.sol";
import "../mocks/MarketplaceMock.sol";
import "../mocks/RoyaltyReceiverMock.sol";
import "../mocks/MultiSigMock.sol";
import "../utils/TestStructs.sol";

contract PaymentProcessorSaleScenarioBase is Test {

    uint256 internal sellerKey;
    uint256 internal buyerKey;
    uint256 internal delegatedPurchaserKey;

    address internal sellerEOA;
    address internal buyerEOA;
    address internal delegatedPurchaserEOA;

    MultiSigMock internal sellerMultiSig;
    MultiSigMock internal buyerMultiSig;

    PaymentProcessor internal paymentProcessor;
    ERC721Mock internal erc721Mock;
    ERC1155Mock internal erc1155Mock;
    MarketplaceMock internal marketplaceMock;
    MarketplaceMock internal marketplaceMockUnwhitelisted;
    RoyaltyReceiverMock internal royaltyReceiverMock;

    ERC20Mock internal approvedPaymentCoin;
    ERC20Mock internal unapprovedPaymentCoin;

    // Profile 1
    uint256 internal SECURITY_POLICY_MOST_PERMISSIVE;

    // Profile 2
    uint256 internal SECURITY_POLICY_MOST_RESTRICTIVE;

    // Profile 3
    uint256 internal SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS;

    // Profile 4
    uint256 internal SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES;

    // Profile 5
    uint256 internal SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES;

    // Profile 6
    uint256 internal SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED;

    // Profile 7
    uint256 internal SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED;

    uint256[] internal _securityPolicies;

    mapping (address => uint256) internal _nextAvailableTokenId;
    mapping (address => uint256) internal _nonces;

    function setUp() public virtual {
        approvedPaymentCoin = new ERC20Mock(18);
        unapprovedPaymentCoin = new ERC20Mock(18);

        address[] memory defaultCoins = new address[](1);
        defaultCoins[0] = address(approvedPaymentCoin);

        paymentProcessor = new PaymentProcessor(address(this), 2_300, defaultCoins);
        
        erc721Mock = new ERC721Mock("Test", "TEST");
        erc1155Mock = new ERC1155Mock();
        marketplaceMock = new MarketplaceMock(paymentProcessor);
        marketplaceMockUnwhitelisted = new MarketplaceMock(paymentProcessor);
        royaltyReceiverMock = new RoyaltyReceiverMock();
        sellerMultiSig = new MultiSigMock();
        buyerMultiSig = new MultiSigMock();

        sellerKey = 0x1eadbeef;
        buyerKey = 0x2eadbeef;
        delegatedPurchaserKey = 0x3eadbeef;

        sellerEOA = vm.addr(sellerKey);
        buyerEOA = vm.addr(buyerKey);
        delegatedPurchaserEOA = vm.addr(delegatedPurchaserKey);

        SECURITY_POLICY_MOST_PERMISSIVE = paymentProcessor.DEFAULT_SECURITY_POLICY_ID();

        SECURITY_POLICY_MOST_RESTRICTIVE = paymentProcessor.createSecurityPolicy(
            true, 
            true, 
            false,
            true, 
            true, 
            true, 
            true, 
            2300, 
            "MOST RESTRICTIVE");

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

        paymentProcessor.whitelistExchange(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED, address(marketplaceMock));
        paymentProcessor.whitelistExchange(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED, address(marketplaceMock));
        paymentProcessor.whitelistExchange(SECURITY_POLICY_MOST_RESTRICTIVE, address(marketplaceMock));

        paymentProcessor.whitelistPaymentMethod(SECURITY_POLICY_MOST_RESTRICTIVE, address(approvedPaymentCoin));

        _securityPolicies.push(SECURITY_POLICY_MOST_PERMISSIVE);
        _securityPolicies.push(SECURITY_POLICY_MOST_RESTRICTIVE);
        _securityPolicies.push(SECURITY_POLICY_DISABLE_PRIVATE_LISTINGS);
        _securityPolicies.push(SECURITY_POLICY_DISABLE_DELEGATED_PURCHASES);
        _securityPolicies.push(SECURITY_POLICY_DISABLE_EIP1271_SIGNATURES);
        _securityPolicies.push(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_ALLOWED);
        _securityPolicies.push(SECURITY_POLICY_ENFORCE_EXCHANGE_WHITELIST_EOA_CALLERS_NOT_ALLOWED);
    }

    function _getNextNonce(address account) internal returns (uint256) {
        uint256 nextUnusedNonce = _nonces[account];
        ++_nonces[account];
        return nextUnusedNonce;
    }

    function _getNextAvailableTokenId(address collection) internal returns (uint256) {
        uint256 nextTokenId = _nextAvailableTokenId[collection];
        ++_nextAvailableTokenId[collection];
        return nextTokenId;
    }

    function _mintAndDealTokensForSale(TokenProtocols tokenProtocol, address royaltyReceiver, MatchedOrder memory saleDetails) internal {
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

    function _getSignedListing(uint256 sellerKey_, MatchedOrder memory saleDetails) internal view returns (SignatureECDSA memory) {
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

        (uint8 listingV, bytes32 listingR, bytes32 listingS) = vm.sign(sellerKey_, listingDigest);
        SignatureECDSA memory signedListing = SignatureECDSA({v: listingV, r: listingR, s: listingS});

        return signedListing;
    }

    function _getSignedBundledListing(
        uint256 sellerKey_, 
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

        (uint8 listingV, bytes32 listingR, bytes32 listingS) = vm.sign(sellerKey_, listingDigest);
        SignatureECDSA memory signedListing = SignatureECDSA({v: listingV, r: listingR, s: listingS});

        return signedListing;
    }

    function _getSignedOffer(uint256 buyerKey_, MatchedOrder memory saleDetails) internal view returns (SignatureECDSA memory) {
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

        (uint8 offerV, bytes32 offerR, bytes32 offerS) = vm.sign(buyerKey_, offerDigest);
        SignatureECDSA memory signedOffer = SignatureECDSA({v: offerV, r: offerR, s: offerS});

        return signedOffer;
    }

    function _getSignedCollectionOffer(uint256 buyerKey_, MatchedOrder memory saleDetails) internal view returns (SignatureECDSA memory) {
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

        (uint8 offerV, bytes32 offerR, bytes32 offerS) = vm.sign(buyerKey_, offerDigest);
        SignatureECDSA memory signedOffer = SignatureECDSA({v: offerV, r: offerR, s: offerS});

        return signedOffer;
    }

    function _getSignedOfferForBundledItems(
        uint256 buyerKey_, 
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

        (uint8 offerV, bytes32 offerR, bytes32 offerS) = vm.sign(buyerKey_, offerDigest);
        SignatureECDSA memory signedOffer = SignatureECDSA({v: offerV, r: offerR, s: offerS});

        return signedOffer;
    }

    function _executeSingleSale(
        address purchaser,
        MatchedOrder memory saleDetails,
        SignatureECDSA memory signedListing,
        SignatureECDSA memory signedOffer,
        bool marketplacePassthrough) internal {
        
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

    function _executeSingleSaleExpectingRevert(
        address purchaser,
        MatchedOrder memory saleDetails,
        SignatureECDSA memory signedListing,
        SignatureECDSA memory signedOffer,
        bool marketplacePassthrough,
        string memory customErrorMessage) internal {
        
        uint256 msgValue = saleDetails.paymentCoin == address(0) ? saleDetails.offerPrice : 0;

        if(purchaser == address(buyerMultiSig)) {
            if(saleDetails.paymentCoin == address(0)) {
                vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
                buyerMultiSig.buySingleListing(address(paymentProcessor), saleDetails, signedListing, signedOffer);
            } else {
                vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
                buyerMultiSig.buySingleListingCoin(address(paymentProcessor), saleDetails, signedListing, signedOffer);
            }
        } else {
            
            if (marketplacePassthrough) {
                vm.prank(purchaser);
                vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
                MarketplaceMock(payable(saleDetails.marketplace)).buySingleListing{value: msgValue}(
                    saleDetails, 
                    signedListing,
                    signedOffer);
            } else {
                vm.prank(purchaser, purchaser);
                vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
                paymentProcessor.buySingleListing{value: msgValue}(saleDetails, signedListing, signedOffer);
            }
        }
    }

    function _executeBatchedSaleExpectingRevert(
        address purchaser,
        MatchedOrder[] memory saleDetailsBatch,
        SignatureECDSA[] memory signedListingsBatch,
        SignatureECDSA[] memory signedOffersBatch,
        bool marketplacePassthrough,
        string memory customErrorMessage) internal {
        
        uint256 msgValue = 0;
        
        for(uint256 i = 0; i < saleDetailsBatch.length; ++i) {
            if(saleDetailsBatch[i].paymentCoin == address(0)) {
                msgValue += saleDetailsBatch[i].offerPrice;
            }
        }

        if(purchaser == address(buyerMultiSig)) {
            vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
            buyerMultiSig.buyBatchOfListings(address(paymentProcessor), saleDetailsBatch, signedListingsBatch, signedOffersBatch);
        } else {
            vm.startPrank(purchaser);
            if (marketplacePassthrough) {
                vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
                MarketplaceMock(payable(saleDetailsBatch[0].marketplace)).buyBatchOfListings{value: msgValue}(
                    saleDetailsBatch, 
                    signedListingsBatch,
                    signedOffersBatch);
            } else {
                vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
                paymentProcessor.buyBatchOfListings{value: msgValue}(saleDetailsBatch, signedListingsBatch, signedOffersBatch);
            }
            vm.stopPrank();
        }
    }

    function _executeBatchedSale(
        address purchaser,
        MatchedOrder[] memory saleDetailsBatch,
        SignatureECDSA[] memory signedListingsBatch,
        SignatureECDSA[] memory signedOffersBatch,
        bool marketplacePassthrough) internal {
        
        uint256 msgValue = 0;
        
        for(uint256 i = 0; i < saleDetailsBatch.length; ++i) {
            if(saleDetailsBatch[i].paymentCoin == address(0)) {
                msgValue += saleDetailsBatch[i].offerPrice;
            }
        }

        if(purchaser == address(buyerMultiSig)) {
            buyerMultiSig.buyBatchOfListings(address(paymentProcessor), saleDetailsBatch, signedListingsBatch, signedOffersBatch);
        } else {
            vm.startPrank(purchaser);
            if (marketplacePassthrough) {
                MarketplaceMock(payable(saleDetailsBatch[0].marketplace)).buyBatchOfListings{value: msgValue}(
                    saleDetailsBatch, 
                    signedListingsBatch,
                    signedOffersBatch);
            } else {
                paymentProcessor.buyBatchOfListings{value: msgValue}(saleDetailsBatch, signedListingsBatch, signedOffersBatch);
            }
            vm.stopPrank();
        }
    }

    function _executeBundledPurchase(
        address purchaser,
        MatchedOrderBundleBase memory bundledOfferDetails,
        SignatureECDSA memory signedOffer,
        BundledItem[] memory bundledOfferItems,
        SignatureECDSA[] memory signedListings,
        bool /*marketplacePassthrough*/) internal {
        
        uint256 msgValue = bundledOfferDetails.paymentCoin == address(0) ? bundledOfferDetails.offerPrice : 0;

        vm.startPrank(purchaser);
        paymentProcessor.sweepCollection{value: msgValue}(
            signedOffer, 
            bundledOfferDetails, 
            bundledOfferItems, 
            signedListings);
        vm.stopPrank();

        //if(purchaser == address(buyerMultiSig)) {
        //    if(saleDetails.paymentCoin == address(0)) {
        //        buyerMultiSig.executeSale(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    } else {
        //        buyerMultiSig.executeSaleCoin(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    }
        //} else {
        //    vm.startPrank(purchaser);
        //    if (marketplacePassthrough) {
        //        MarketplaceMock(payable(saleDetails.marketplace)).executeSale{value: msgValue}(
        //            saleDetails, 
        //            signedListing,
        //            signedOffer);
        //    } else {
        //        paymentProcessor.executeSale{value: msgValue}(saleDetails, signedListing, signedOffer);
        //    }
        //    vm.stopPrank();
        //}
    }

    function _executeBundledPurchaseExpectingRevert(
        address purchaser,
        MatchedOrderBundleBase memory bundledOfferDetails,
        SignatureECDSA memory signedOffer,
        BundledItem[] memory bundledOfferItems,
        SignatureECDSA[] memory signedListings,
        bool /*marketplacePassthrough*/,
        string memory customErrorMessage) internal {
        
        uint256 msgValue = bundledOfferDetails.paymentCoin == address(0) ? bundledOfferDetails.offerPrice : 0;

        vm.startPrank(purchaser);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
        paymentProcessor.sweepCollection{value: msgValue}(signedOffer, bundledOfferDetails, bundledOfferItems, signedListings);
        vm.stopPrank();

        //if(purchaser == address(buyerMultiSig)) {
        //    if(saleDetails.paymentCoin == address(0)) {
        //        buyerMultiSig.executeSale(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    } else {
        //        buyerMultiSig.executeSaleCoin(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    }
        //} else {
        //    vm.startPrank(purchaser);
        //    if (marketplacePassthrough) {
        //        MarketplaceMock(payable(saleDetails.marketplace)).executeSale{value: msgValue}(
        //            saleDetails, 
        //            signedListing,
        //            signedOffer);
        //    } else {
        //        paymentProcessor.executeSale{value: msgValue}(saleDetails, signedListing, signedOffer);
        //    }
        //    vm.stopPrank();
        //}
    }

    function _executeBundledListingPurchase(
        address purchaser,
        MatchedOrderBundleExtended memory bundledOfferDetails,
        SignatureECDSA memory signedOffer,
        SignatureECDSA memory signedListing,
        BundledItem[] memory bundledOfferItems,
        bool /*marketplacePassthrough*/) internal {
        
        uint256 msgValue = bundledOfferDetails.bundleBase.paymentCoin == address(0) ? bundledOfferDetails.bundleBase.offerPrice : 0;

        vm.startPrank(purchaser);
        paymentProcessor.buyBundledListing{value: msgValue}(
            signedListing,
            signedOffer, 
            bundledOfferDetails, 
            bundledOfferItems);
        vm.stopPrank();

        //if(purchaser == address(buyerMultiSig)) {
        //    if(saleDetails.paymentCoin == address(0)) {
        //        buyerMultiSig.executeSale(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    } else {
        //        buyerMultiSig.executeSaleCoin(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    }
        //} else {
        //    vm.startPrank(purchaser);
        //    if (marketplacePassthrough) {
        //        MarketplaceMock(payable(saleDetails.marketplace)).executeSale{value: msgValue}(
        //            saleDetails, 
        //            signedListing,
        //            signedOffer);
        //    } else {
        //        paymentProcessor.executeSale{value: msgValue}(saleDetails, signedListing, signedOffer);
        //    }
        //    vm.stopPrank();
        //}
    }

    function _executeBundledListingPurchaseExpectingRevert(
        address purchaser,
        MatchedOrderBundleExtended memory bundledOfferDetails,
        SignatureECDSA memory signedOffer,
        SignatureECDSA memory signedListing,
        BundledItem[] memory bundledOfferItems,
        bool /*marketplacePassthrough*/,
        string memory customErrorMessage) internal {
        
        uint256 msgValue = bundledOfferDetails.bundleBase.paymentCoin == address(0) ? bundledOfferDetails.bundleBase.offerPrice : 0;

        vm.startPrank(purchaser);
        vm.expectRevert(bytes4(keccak256(abi.encodePacked(customErrorMessage))));
        paymentProcessor.buyBundledListing{value: msgValue}(
            signedListing,
            signedOffer, 
            bundledOfferDetails, 
            bundledOfferItems);
        vm.stopPrank();

        //if(purchaser == address(buyerMultiSig)) {
        //    if(saleDetails.paymentCoin == address(0)) {
        //        buyerMultiSig.executeSale(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    } else {
        //        buyerMultiSig.executeSaleCoin(address(paymentProcessor), saleDetails, signedListing, signedOffer);
        //    }
        //} else {
        //    vm.startPrank(purchaser);
        //    if (marketplacePassthrough) {
        //        MarketplaceMock(payable(saleDetails.marketplace)).executeSale{value: msgValue}(
        //            saleDetails, 
        //            signedListing,
        //            signedOffer);
        //    } else {
        //        paymentProcessor.executeSale{value: msgValue}(saleDetails, signedListing, signedOffer);
        //    }
        //    vm.stopPrank();
        //}
    }
}