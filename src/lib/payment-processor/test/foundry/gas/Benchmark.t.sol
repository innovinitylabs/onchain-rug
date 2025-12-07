pragma solidity 0.8.9;

import "../sales/PaymentProcessorSaleScenarioBase.t.sol";
import "./SeaportTestERC20.sol";
import "./SeaportTestERC721.sol";
import "./SeaportTestERC1155.sol";

contract Benchmark is PaymentProcessorSaleScenarioBase {

    struct FuzzInputsCommon {
        uint256 tokenId;
        uint128 paymentAmount;
    }

    uint256 constant MAX_INT = ~uint256(0);

    uint256 internal alicePk = 0xa11ce;
    uint256 internal bobPk = 0xb0b;
    uint256 internal calPk = 0xca1;
    uint256 internal abePk = 0xabe;
    address payable internal alice = payable(vm.addr(alicePk));
    address payable internal bob = payable(vm.addr(bobPk));
    address payable internal cal = payable(vm.addr(calPk));
    address payable internal abe = payable(vm.addr(abePk));

    SeaportTestERC20 internal token1;
    SeaportTestERC20 internal token2;
    SeaportTestERC20 internal token3;

    SeaportTestERC721 internal test721_1;
    SeaportTestERC721 internal test721_2;
    SeaportTestERC721 internal test721_3;

    SeaportTestERC1155 internal test1155_1;
    SeaportTestERC1155 internal test1155_2;
    SeaportTestERC1155 internal test1155_3;

    SeaportTestERC20[] erc20s;
    SeaportTestERC721[] erc721s;
    SeaportTestERC1155[] erc1155s;

    function setUp() public virtual override {
        super.setUp();

        vm.label(alice, "alice");
        vm.label(bob, "bob");
        vm.label(cal, "cal");
        vm.label(abe, "abe");
        vm.label(address(this), "testContract");

        _deployTestTokenContracts();
        erc20s = [token1, token2, token3];
        erc721s = [test721_1, test721_2, test721_3];
        erc1155s = [test1155_1, test1155_2, test1155_3];

        allocateTokensAndApprovals(address(this), uint128(MAX_INT));
        allocateTokensAndApprovals(alice, uint128(MAX_INT));
        allocateTokensAndApprovals(bob, uint128(MAX_INT));
        allocateTokensAndApprovals(cal, uint128(MAX_INT));
        allocateTokensAndApprovals(abe, uint128(MAX_INT));

        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            false, 
            true, 
            false, 
            false, 
            false, 
            false, 
            false, 
            2300, 
            "");

        for (uint256 i = 0; i < erc20s.length; ++i) {
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, address(erc20s[i]));
        }

        for (uint256 i = 0; i < erc721s.length; ++i) {
            paymentProcessor.setCollectionSecurityPolicy(address(erc721s[i]), securityPolicyId);
            
        }

        for (uint256 i = 0; i < erc1155s.length; ++i) {
            paymentProcessor.setCollectionSecurityPolicy(address(erc1155s[i]), securityPolicyId);
        }
    }

    /**
     * @dev deploy test token contracts
     */
    function _deployTestTokenContracts() internal {
        token1 = new SeaportTestERC20();
        token2 = new SeaportTestERC20();
        token3 = new SeaportTestERC20();
        test721_1 = new SeaportTestERC721();
        test721_2 = new SeaportTestERC721();
        test721_3 = new SeaportTestERC721();
        test1155_1 = new SeaportTestERC1155();
        test1155_2 = new SeaportTestERC1155();
        test1155_3 = new SeaportTestERC1155();

        vm.label(address(token1), "token1");
        vm.label(address(test721_1), "test721_1");
        vm.label(address(test1155_1), "test1155_1");
    }

    /**
     * @dev allocate amount of each token, 1 of each 721, and 1, 5, and 10 of respective 1155s
     */
    function allocateTokensAndApprovals(address _to, uint128 _amount) internal {
        vm.deal(_to, _amount);
        for (uint256 i = 0; i < erc20s.length; ++i) {
            erc20s[i].mint(_to, _amount);
        }
        _setApprovals(_to);
    }

    function _setApprovals(address _owner) internal virtual {
        vm.startPrank(_owner);
        for (uint256 i = 0; i < erc20s.length; ++i) {
            erc20s[i].approve(address(paymentProcessor), MAX_INT);
        }
        for (uint256 i = 0; i < erc721s.length; ++i) {
            erc721s[i].setApprovalForAll(address(paymentProcessor), true);
        }
        for (uint256 i = 0; i < erc1155s.length; ++i) {
            erc1155s[i].setApprovalForAll(address(paymentProcessor), true);
        }
        vm.stopPrank();
    }

    function test_benchmarkBuySingleListingNoFees() public {
        uint256 paymentAmount = 100 ether;

        for (uint256 tokenId = 1; tokenId <= 100; tokenId++) {
            test721_1.mint(alice, tokenId);
            test721_1.setTokenRoyalty(tokenId, abe, 0);
    
            MatchedOrder memory saleDetails = MatchedOrder({
                sellerAcceptedOffer: false,
                collectionLevelOffer: false,
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                seller: alice,
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 0,
                maxRoyaltyFeeNumerator: 0,
                listingNonce: _getNextNonce(alice),
                offerNonce: _getNextNonce(bob),
                listingMinPrice: paymentAmount,
                offerPrice: paymentAmount,
                listingExpiration: type(uint256).max,
                offerExpiration: type(uint256).max,
                tokenId: tokenId,
                amount: 1
            });
    
            SignatureECDSA memory signedListing = _getSignedListing(alicePk, saleDetails);
            SignatureECDSA memory signedOffer = _getSignedOffer(bobPk, saleDetails);
    
            vm.prank(bob, bob);
            paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(
                saleDetails, 
                signedListing, 
                signedOffer);
        }
    }

    function test_benchmarkBuySingleListingMarketplaceFees() public {
        uint256 paymentAmount = 100 ether;

        for (uint256 tokenId = 1; tokenId <= 100; tokenId++) {
            test721_1.mint(alice, tokenId);
            test721_1.setTokenRoyalty(tokenId, abe, 0);
    
            MatchedOrder memory saleDetails = MatchedOrder({
                sellerAcceptedOffer: false,
                collectionLevelOffer: false,
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                seller: alice,
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 500,
                maxRoyaltyFeeNumerator: 0,
                listingNonce: _getNextNonce(alice),
                offerNonce: _getNextNonce(bob),
                listingMinPrice: paymentAmount,
                offerPrice: paymentAmount,
                listingExpiration: type(uint256).max,
                offerExpiration: type(uint256).max,
                tokenId: tokenId,
                amount: 1
            });
    
            SignatureECDSA memory signedListing = _getSignedListing(alicePk, saleDetails);
            SignatureECDSA memory signedOffer = _getSignedOffer(bobPk, saleDetails);
    
            vm.prank(bob, bob);
            paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(
                saleDetails, 
                signedListing, 
                signedOffer);
        }
    }

    function test_benchmarkBuySingleListingMarketplaceAndRoyaltyFees() public {
        uint256 paymentAmount = 100 ether;

        for (uint256 tokenId = 1; tokenId <= 100; tokenId++) {
            test721_1.mint(alice, tokenId);
            test721_1.setTokenRoyalty(tokenId, abe, 1000);
    
            MatchedOrder memory saleDetails = MatchedOrder({
                sellerAcceptedOffer: false,
                collectionLevelOffer: false,
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                seller: alice,
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 500,
                maxRoyaltyFeeNumerator: 1000,
                listingNonce: _getNextNonce(alice),
                offerNonce: _getNextNonce(bob),
                listingMinPrice: paymentAmount,
                offerPrice: paymentAmount,
                listingExpiration: type(uint256).max,
                offerExpiration: type(uint256).max,
                tokenId: tokenId,
                amount: 1
            });
    
            SignatureECDSA memory signedListing = _getSignedListing(alicePk, saleDetails);
            SignatureECDSA memory signedOffer = _getSignedOffer(bobPk, saleDetails);
    
            vm.prank(bob, bob);
            paymentProcessor.buySingleListing{value: saleDetails.offerPrice}(
                saleDetails, 
                signedListing, 
                signedOffer);
        }
    }

    function test_benchmarkBuyBundledListingNoFees() public {
        uint256 numRuns = 100;
        uint256 numItemsInBundle = 100;
        uint256 paymentAmount = 100 ether;

        for (uint256 run = 1; run <= numRuns; run++) {
            MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 0,
                offerNonce: _getNextNonce(bob),
                offerPrice: paymentAmount * numItemsInBundle,
                offerExpiration: type(uint256).max
            });
    
            MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
                bundleBase: bundledOfferDetails,
                seller: alice,
                listingNonce: _getNextNonce(alice),
                listingExpiration: type(uint256).max
            });
    
            BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
    
            Accumulator memory accumulator = Accumulator({
                tokenIds: new uint256[](numItemsInBundle),
                amounts: new uint256[](numItemsInBundle),
                salePrices: new uint256[](numItemsInBundle),
                maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
                sellers: new address[](numItemsInBundle),
                sumListingPrices: 0
            });
    
            for (uint256 i = 0; i < numItemsInBundle; ++i) {
                bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(test721_1));
                bundledOfferItems[i].amount = 1;
                bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
                bundledOfferItems[i].itemPrice = paymentAmount;
                bundledOfferItems[i].listingNonce = 0;
                bundledOfferItems[i].listingExpiration = 0;
                bundledOfferItems[i].seller = alice;
    
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
    
                accumulator.tokenIds[i] = saleDetails.tokenId;
                accumulator.amounts[i] = saleDetails.amount;
                accumulator.salePrices[i] = saleDetails.listingMinPrice;
                accumulator.maxRoyaltyFeeNumerators[i] = saleDetails.maxRoyaltyFeeNumerator;
                accumulator.sellers[i] = sellerEOA;
                accumulator.sumListingPrices += saleDetails.listingMinPrice;
    
                test721_1.mint(alice, saleDetails.tokenId);
                test721_1.setTokenRoyalty(saleDetails.tokenId, abe, 0);
            }
    
            AccumulatorHashes memory accumulatorHashes = 
                AccumulatorHashes({
                    tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                    amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                    maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                    itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
                });
    
            SignatureECDSA memory signedBundledOffer = _getSignedOfferForBundledItems(bobPk, bundledOfferDetails, bundledOfferItems);
            SignatureECDSA memory signedBundledListing = _getSignedBundledListing(alicePk, accumulatorHashes, bundleOfferDetailsExtended);
    
            vm.prank(bob, bob);
            paymentProcessor.buyBundledListing{value: bundledOfferDetails.offerPrice}(
                signedBundledListing,
                signedBundledOffer, 
                bundleOfferDetailsExtended, 
            bundledOfferItems);
        }
    }

    function test_benchmarkBuyBundledListingMarketplaceFees() public {
        uint256 numRuns = 100;
        uint256 numItemsInBundle = 100;
        uint256 paymentAmount = 100 ether;

        for (uint256 run = 1; run <= numRuns; run++) {
            MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 500,
                offerNonce: _getNextNonce(bob),
                offerPrice: paymentAmount * numItemsInBundle,
                offerExpiration: type(uint256).max
            });
    
            MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
                bundleBase: bundledOfferDetails,
                seller: alice,
                listingNonce: _getNextNonce(alice),
                listingExpiration: type(uint256).max
            });
    
            BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
    
            Accumulator memory accumulator = Accumulator({
                tokenIds: new uint256[](numItemsInBundle),
                amounts: new uint256[](numItemsInBundle),
                salePrices: new uint256[](numItemsInBundle),
                maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
                sellers: new address[](numItemsInBundle),
                sumListingPrices: 0
            });
    
            for (uint256 i = 0; i < numItemsInBundle; ++i) {
                bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(test721_1));
                bundledOfferItems[i].amount = 1;
                bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
                bundledOfferItems[i].itemPrice = paymentAmount;
                bundledOfferItems[i].listingNonce = 0;
                bundledOfferItems[i].listingExpiration = 0;
                bundledOfferItems[i].seller = alice;
    
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
    
                accumulator.tokenIds[i] = saleDetails.tokenId;
                accumulator.amounts[i] = saleDetails.amount;
                accumulator.salePrices[i] = saleDetails.listingMinPrice;
                accumulator.maxRoyaltyFeeNumerators[i] = saleDetails.maxRoyaltyFeeNumerator;
                accumulator.sellers[i] = sellerEOA;
                accumulator.sumListingPrices += saleDetails.listingMinPrice;
    
                test721_1.mint(alice, saleDetails.tokenId);
                test721_1.setTokenRoyalty(saleDetails.tokenId, abe, 0);
            }
    
            AccumulatorHashes memory accumulatorHashes = 
                AccumulatorHashes({
                    tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                    amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                    maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                    itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
                });
    
            SignatureECDSA memory signedBundledOffer = _getSignedOfferForBundledItems(bobPk, bundledOfferDetails, bundledOfferItems);
            SignatureECDSA memory signedBundledListing = _getSignedBundledListing(alicePk, accumulatorHashes, bundleOfferDetailsExtended);
    
            vm.prank(bob, bob);
            paymentProcessor.buyBundledListing{value: bundledOfferDetails.offerPrice}(
                signedBundledListing,
                signedBundledOffer, 
                bundleOfferDetailsExtended, 
            bundledOfferItems);
        }
    }

    function test_benchmarkBuyBundledListingMarketplaceAndRoyaltyFees() public {
        uint256 numRuns = 100;
        uint256 numItemsInBundle = 100;
        uint256 paymentAmount = 100 ether;

        for (uint256 run = 1; run <= numRuns; run++) {
            MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 500,
                offerNonce: _getNextNonce(bob),
                offerPrice: paymentAmount * numItemsInBundle,
                offerExpiration: type(uint256).max
            });
    
            MatchedOrderBundleExtended memory bundleOfferDetailsExtended = MatchedOrderBundleExtended({
                bundleBase: bundledOfferDetails,
                seller: alice,
                listingNonce: _getNextNonce(alice),
                listingExpiration: type(uint256).max
            });
    
            BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
    
            Accumulator memory accumulator = Accumulator({
                tokenIds: new uint256[](numItemsInBundle),
                amounts: new uint256[](numItemsInBundle),
                salePrices: new uint256[](numItemsInBundle),
                maxRoyaltyFeeNumerators: new uint256[](numItemsInBundle),
                sellers: new address[](numItemsInBundle),
                sumListingPrices: 0
            });
    
            for (uint256 i = 0; i < numItemsInBundle; ++i) {
                bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(test721_1));
                bundledOfferItems[i].amount = 1;
                bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
                bundledOfferItems[i].itemPrice = paymentAmount;
                bundledOfferItems[i].listingNonce = 0;
                bundledOfferItems[i].listingExpiration = 0;
                bundledOfferItems[i].seller = alice;
    
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
    
                accumulator.tokenIds[i] = saleDetails.tokenId;
                accumulator.amounts[i] = saleDetails.amount;
                accumulator.salePrices[i] = saleDetails.listingMinPrice;
                accumulator.maxRoyaltyFeeNumerators[i] = saleDetails.maxRoyaltyFeeNumerator;
                accumulator.sellers[i] = sellerEOA;
                accumulator.sumListingPrices += saleDetails.listingMinPrice;
    
                test721_1.mint(alice, saleDetails.tokenId);
                test721_1.setTokenRoyalty(saleDetails.tokenId, abe, 1000);
            }
    
            AccumulatorHashes memory accumulatorHashes = 
                AccumulatorHashes({
                    tokenIdsKeccakHash: keccak256(abi.encodePacked(accumulator.tokenIds)),
                    amountsKeccakHash: keccak256(abi.encodePacked(accumulator.amounts)),
                    maxRoyaltyFeeNumeratorsKeccakHash: keccak256(abi.encodePacked(accumulator.maxRoyaltyFeeNumerators)),
                    itemPricesKeccakHash: keccak256(abi.encodePacked(accumulator.salePrices))
                });
    
            SignatureECDSA memory signedBundledOffer = _getSignedOfferForBundledItems(bobPk, bundledOfferDetails, bundledOfferItems);
            SignatureECDSA memory signedBundledListing = _getSignedBundledListing(alicePk, accumulatorHashes, bundleOfferDetailsExtended);
    
            vm.prank(bob, bob);
            paymentProcessor.buyBundledListing{value: bundledOfferDetails.offerPrice}(
                signedBundledListing,
                signedBundledOffer, 
                bundleOfferDetailsExtended, 
            bundledOfferItems);
        }
    }

    function test_benchmarkSweepCollectionNoFees() public {
        uint256 numRuns = 50;
        uint256 numItemsInBundle = 100;
        uint256 paymentAmount = 100 ether;

        for (uint256 run = 1; run <= numRuns; run++) {
            MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 0,
                offerNonce: _getNextNonce(bob),
                offerPrice: paymentAmount * numItemsInBundle,
                offerExpiration: type(uint256).max
            });
    
            BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
            SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
    
            for (uint256 i = 0; i < numItemsInBundle; ++i) {
                uint256 fakeAddressPk = 1000000 + i;
                address fakeAddress = payable(vm.addr(fakeAddressPk));
    
                bundledOfferItems[i].seller = fakeAddress;
                bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(test721_1));
                bundledOfferItems[i].amount = 1;
                bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
                bundledOfferItems[i].listingNonce = _getNextNonce(fakeAddress);
                bundledOfferItems[i].itemPrice = paymentAmount;
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
    
                signedListings[i] = _getSignedListing(fakeAddressPk, saleDetails);
    
                test721_1.mint(fakeAddress, saleDetails.tokenId);
                test721_1.setTokenRoyalty(saleDetails.tokenId, abe, 0);
    
                vm.prank(fakeAddress);
                test721_1.setApprovalForAll(address(paymentProcessor), true);
            }
    
            SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(bobPk, bundledOfferDetails, bundledOfferItems);
    
            vm.prank(bob, bob);
            paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(
                signedOffer, 
                bundledOfferDetails, 
                bundledOfferItems, 
                signedListings);
        }
    }

    function test_benchmarkSweepCollectionMarketplaceFees() public {
        uint256 numRuns = 50;
        uint256 numItemsInBundle = 100;
        uint256 paymentAmount = 100 ether;

        for (uint256 run = 1; run <= numRuns; run++) {
            MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 500,
                offerNonce: _getNextNonce(bob),
                offerPrice: paymentAmount * numItemsInBundle,
                offerExpiration: type(uint256).max
            });
    
            BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
            SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
    
            for (uint256 i = 0; i < numItemsInBundle; ++i) {
                uint256 fakeAddressPk = 1000000 + i;
                address fakeAddress = payable(vm.addr(fakeAddressPk));
    
                bundledOfferItems[i].seller = fakeAddress;
                bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(test721_1));
                bundledOfferItems[i].amount = 1;
                bundledOfferItems[i].maxRoyaltyFeeNumerator = 0;
                bundledOfferItems[i].listingNonce = _getNextNonce(fakeAddress);
                bundledOfferItems[i].itemPrice = paymentAmount;
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
    
                signedListings[i] = _getSignedListing(fakeAddressPk, saleDetails);
    
                test721_1.mint(fakeAddress, saleDetails.tokenId);
                test721_1.setTokenRoyalty(saleDetails.tokenId, abe, 0);
    
                vm.prank(fakeAddress);
                test721_1.setApprovalForAll(address(paymentProcessor), true);
            }
    
            SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(bobPk, bundledOfferDetails, bundledOfferItems);
    
            vm.prank(bob, bob);
            paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(
                signedOffer, 
                bundledOfferDetails, 
                bundledOfferItems, 
                signedListings);
        }
    }

    function test_benchmarkSweepCollectionMarketplaceAndRoyaltyFees() public {
        uint256 numRuns = 45;
        uint256 numItemsInBundle = 100;
        uint256 paymentAmount = 100 ether;

        for (uint256 run = 1; run <= numRuns; run++) {
            MatchedOrderBundleBase memory bundledOfferDetails = MatchedOrderBundleBase({
                protocol: TokenProtocols.ERC721,
                paymentCoin: address(0),
                tokenAddress: address(test721_1),
                privateBuyer: address(0),
                buyer: bob,
                delegatedPurchaser: address(0),
                marketplace: cal,
                marketplaceFeeNumerator: 500,
                offerNonce: _getNextNonce(bob),
                offerPrice: paymentAmount * numItemsInBundle,
                offerExpiration: type(uint256).max
            });
    
            BundledItem[] memory bundledOfferItems = new BundledItem[](numItemsInBundle);
            SignatureECDSA[] memory signedListings = new SignatureECDSA[](numItemsInBundle);
    
            for (uint256 i = 0; i < numItemsInBundle; ++i) {
                uint256 fakeAddressPk = 1000000 + i;
                address fakeAddress = payable(vm.addr(fakeAddressPk));
    
                bundledOfferItems[i].seller = fakeAddress;
                bundledOfferItems[i].tokenId = _getNextAvailableTokenId(address(test721_1));
                bundledOfferItems[i].amount = 1;
                bundledOfferItems[i].maxRoyaltyFeeNumerator = 1000;
                bundledOfferItems[i].listingNonce = _getNextNonce(fakeAddress);
                bundledOfferItems[i].itemPrice = paymentAmount;
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
    
                signedListings[i] = _getSignedListing(fakeAddressPk, saleDetails);
    
                test721_1.mint(fakeAddress, saleDetails.tokenId);
                test721_1.setTokenRoyalty(saleDetails.tokenId, abe, 1000);
    
                vm.prank(fakeAddress);
                test721_1.setApprovalForAll(address(paymentProcessor), true);
            }
    
            SignatureECDSA memory signedOffer = _getSignedOfferForBundledItems(bobPk, bundledOfferDetails, bundledOfferItems);
    
            vm.prank(bob, bob);
            paymentProcessor.sweepCollection{value: bundledOfferDetails.offerPrice}(
                signedOffer, 
                bundledOfferDetails, 
                bundledOfferItems, 
                signedListings);
        }
    }
}