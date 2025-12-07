pragma solidity 0.8.9;

import {Test} from "forge-std/Test.sol";

import "./handlers/PaymentProcessorHandler.sol";

//contract PaymentProcessorInvariants is Test, InvariantTest {
contract PaymentProcessorInvariants is Test {
    PaymentProcessor public paymentProcessor;
    PaymentProcessorHandler public handler;
    address[] _coins;

    function setUp() public {

        address[] memory coinsLocal = new address[](19);
        for (uint8 i = 0; i < 19; ++i) {
            ERC20Mock coinMock = new ERC20Mock(i);
            _coins.push(address(coinMock));
            coinsLocal[i] = address(coinMock);
        }

        paymentProcessor = new PaymentProcessor(address(this), 2_300, coinsLocal);

        handler = new PaymentProcessorHandler(paymentProcessor, 5, 5, 5, 25, coinsLocal);

        bytes4[] memory selectors = new bytes4[](17);
        selectors[0] = PaymentProcessorHandler.forcePush.selector;
        selectors[1] = PaymentProcessorHandler.executeSingleERC721Sale.selector;
        selectors[2] = PaymentProcessorHandler.executeSingleERC1155Sale.selector;
        selectors[3] = PaymentProcessorHandler.executeBatchERC721Sale.selector;
        selectors[4] = PaymentProcessorHandler.executeBatchERC1155Sale.selector;
        selectors[5] = PaymentProcessorHandler.executeBundledERC721Sale.selector;
        selectors[6] = PaymentProcessorHandler.executeBundledERC1155Sale.selector;
        selectors[7] = PaymentProcessorHandler.executeSweepCollectionERC721Sale.selector;
        selectors[8] = PaymentProcessorHandler.executeSweepCollectionERC1155Sale.selector;
        selectors[9] = PaymentProcessorHandler.revokeNextListingNonce.selector;
        selectors[10] = PaymentProcessorHandler.revokeAnyAvailableListingNonce.selector;
        selectors[11] = PaymentProcessorHandler.revokeNextOfferNonce.selector;
        selectors[12] = PaymentProcessorHandler.revokeAnyAvailableOfferNonce.selector;
        selectors[13] = PaymentProcessorHandler.revokeSellerMasterNonce.selector;
        selectors[14] = PaymentProcessorHandler.revokeBuyerMasterNonce.selector;
        selectors[15] = PaymentProcessorHandler.setERC721CollectionSecurityPolicy.selector;
        selectors[16] = PaymentProcessorHandler.setERC1155CollectionSecurityPolicy.selector;

        targetSelector(FuzzSelector({
            addr: address(handler),
            selectors: selectors
        }));

        targetContract(address(handler));
    }

     function invariant_callSummary() public {

        uint256 sumOfSellerBalances = handler.reduceSellerActors(0, this.accumulateEtherBalances);
        console.log("Sum of Seller Balances (Native)");
        console.log("-------------------");
        console.log(sumOfSellerBalances);
        console.log("");

        uint256 sumOfMarketplaceBalances = handler.reduceMarketplaceActors(0, this.accumulateEtherBalances);
        console.log("Sum of Marketplace Balances (Native)");
        console.log("-------------------");
        console.log(sumOfMarketplaceBalances);
        console.log("");

        uint256 sumOfRoyaltyReceiverBalances = handler.reduceRoyaltyReceiverActors(0, this.accumulateEtherBalances);
        console.log("Sum of Royalty Receiver Balances (Native)");
        console.log("-------------------");
        console.log(sumOfRoyaltyReceiverBalances);
        console.log("");

        uint256 sumOfPayouts = sumOfSellerBalances + sumOfMarketplaceBalances + sumOfRoyaltyReceiverBalances;
        console.log("Sum of Payouts (Native)");
        console.log("-------------------");
        console.log(sumOfPayouts);
        console.log("");

        uint256 sumOfSellerBalancesCoin = handler.reduceSellerActors(0, this.accumulateGhostProceedsCoin);
        console.log("Sum of Seller Balances (Coin)");
        console.log("-------------------");
        console.log(sumOfSellerBalancesCoin);
        console.log("");

        uint256 sumOfMarketplaceBalancesCoin = handler.reduceMarketplaceActors(0, this.accumulateGhostProceedsCoin);
        console.log("Sum of Marketplace Balances (Coin)");
        console.log("-------------------");
        console.log(sumOfMarketplaceBalancesCoin);
        console.log("");

        uint256 sumOfRoyaltyReceiverBalancesCoin = handler.reduceRoyaltyReceiverActors(0, this.accumulateGhostProceedsCoin);
        console.log("Sum of Royalty Receiver Balances (Coin)");
        console.log("-------------------");
        console.log(sumOfRoyaltyReceiverBalancesCoin);
        console.log("");

        uint256 sumOfPayoutsCoin = sumOfSellerBalancesCoin + sumOfMarketplaceBalancesCoin + sumOfRoyaltyReceiverBalancesCoin;
        console.log("Sum of Payouts (Coin)");
        console.log("-------------------");
        console.log(sumOfPayoutsCoin);
        console.log("");

        console.log("Number Of ERC721 Tokens Sold");
        console.log("-------------------");
        console.log(handler.ghost_sumOfERC721TokensSold());
        console.log("");

        console.log("Number Of ERC1155 Tokens Sold");
        console.log("-------------------");
        console.log(handler.ghost_sumOfERC1155TokensSold());
        console.log("");

        console.log("Number Of ERC721 Sales Via Passthrough Marketplaces");
        console.log("-------------------");
        console.log(handler.ghost_numberOfERC721SalesViaPassthroughMarketplaces());
        console.log("");

        console.log("Number Of ERC1155 Sales Via Passthrough Marketplaces");
        console.log("-------------------");
        console.log(handler.ghost_numberOfERC1155SalesViaPassthroughMarketplaces());
        console.log("");

        console.log("Number Of ERC721 Tokens Sold Using Multi-Sigs");
        console.log("-------------------");
        console.log(handler.ghost_expectedERC721Balances(handler.getBuyerMultiSigAddress()));
        console.log("");

        console.log("Number Of ERC1155 Tokens Sold Using Multi-Sigs");
        console.log("-------------------");
        console.log(handler.ghost_expectedERC1155Balances(handler.getBuyerMultiSigAddress()));
        console.log("");
    }

    function invariant_paymentProcessorEtherBalanceIsAlwaysEqualToAmountOfForcedEther() public {
        assertEq(handler.ghost_forcePushSum() - handler.ghost_withdrawSum(), address(paymentProcessor).balance);
    }

    function invariant_noEtherDustFromSale() public {
        uint256 sumOfSellerBalances = handler.reduceSellerActors(0, this.accumulateEtherBalances);
        uint256 sumOfMarketplaceBalances = handler.reduceMarketplaceActors(0, this.accumulateEtherBalances);
        uint256 sumOfRoyaltyReceiverBalances = handler.reduceRoyaltyReceiverActors(0, this.accumulateEtherBalances);
        uint256 sumOfPayouts = sumOfSellerBalances + sumOfMarketplaceBalances + sumOfRoyaltyReceiverBalances;
        assertEq(sumOfPayouts, handler.ghost_sumOfPurchasePriceNative());
    }

    function invariant_etherProceedsCorrectlyAllocated() public {
        uint256 sumOfSellerBalances = handler.reduceSellerActors(0, this.accumulateEtherBalances);
        uint256 sumOfMarketplaceBalances = handler.reduceMarketplaceActors(0, this.accumulateEtherBalances);
        uint256 sumOfRoyaltyReceiverBalances = handler.reduceRoyaltyReceiverActors(0, this.accumulateEtherBalances);

        uint256 sumOfSellerProceeds = handler.reduceSellerActors(0, this.accumulateGhostProceedsEther);
        uint256 sumOfMarketplaceProceeds = handler.reduceMarketplaceActors(0, this.accumulateGhostProceedsEther);
        uint256 sumOfRoyaltyReceiverProceeds = handler.reduceRoyaltyReceiverActors(0, this.accumulateGhostProceedsEther);

        assertEq(sumOfSellerBalances, sumOfSellerProceeds);
        assertEq(sumOfMarketplaceBalances, sumOfMarketplaceProceeds);
        assertEq(sumOfRoyaltyReceiverBalances, sumOfRoyaltyReceiverProceeds);
        assertEq(sumOfSellerProceeds + sumOfMarketplaceProceeds + sumOfRoyaltyReceiverProceeds, handler.ghost_sumOfPurchasePriceNative());
    }

    function invariant_coinProceedsCorrectlyAllocated() public {
        uint256 sumOfSellerBalances = handler.reduceSellerActors(0, this.accumulateERC20Balances);
        uint256 sumOfMarketplaceBalances = handler.reduceMarketplaceActors(0, this.accumulateERC20Balances);
        uint256 sumOfRoyaltyReceiverBalances = handler.reduceRoyaltyReceiverActors(0, this.accumulateERC20Balances);

        uint256 sumOfSellerProceeds = handler.reduceSellerActors(0, this.accumulateGhostProceedsCoin);
        uint256 sumOfMarketplaceProceeds = handler.reduceMarketplaceActors(0, this.accumulateGhostProceedsCoin);
        uint256 sumOfRoyaltyReceiverProceeds = handler.reduceRoyaltyReceiverActors(0, this.accumulateGhostProceedsCoin);

        assertEq(sumOfSellerBalances, sumOfSellerProceeds);
        assertEq(sumOfMarketplaceBalances, sumOfMarketplaceProceeds);
        assertEq(sumOfRoyaltyReceiverBalances, sumOfRoyaltyReceiverProceeds);
        assertEq(sumOfSellerProceeds + sumOfMarketplaceProceeds + sumOfRoyaltyReceiverProceeds, handler.ghost_sumOfPurchasePriceCoins());
    }

    function invariant_totalERC721TokensSoldEqualsSumOfAllBuyerBalances() public {
        uint256 sumOfBuyerERC721Balances = handler.reduceBuyerActors(0, this.accumulateERC721Balance);
        assertEq(sumOfBuyerERC721Balances, handler.ghost_sumOfERC721TokensSold());
    }

    function invariant_totalERC1155TokensSoldEqualsSumOfAllBuyerBalances() public {
        uint256 sumOfBuyerERC1155Balances = handler.reduceBuyerActors(0, this.accumulateERC1155Balance);
        assertEq(sumOfBuyerERC1155Balances, handler.ghost_sumOfERC1155TokensSold());
    }

    function accumulateEtherBalances(uint256 balance, address caller) external view returns (uint256) {
        return balance + caller.balance;
    }

    function accumulateERC20Balances(uint256 balance, address caller) external view returns (uint256) {
        return balance + handler.ghost_expectedERC20Balances(caller);
    }

    function print(address account) external view returns (address[] memory tmp) {
        console.log(account);
        return tmp;
    }

    function accumulateGhostProceedsEther(uint256 sumOfProceeds, address account) external view returns (uint256) {
        return sumOfProceeds + handler.ghost_expectedSumOfEtherProceeds(account);
    }

    function accumulateGhostProceedsCoin(uint256 sumOfProceeds, address account) external view returns (uint256) {
        return sumOfProceeds + handler.ghost_expectedSumOfCoinProceeds(account);
    }

    function accumulateERC721Balance(uint256 balanceERC721, address account) external view returns (uint256) {
        return balanceERC721 + handler.ghost_expectedERC721Balances(account);
    }

    function accumulateERC1155Balance(uint256 balanceERC1155, address account) external view returns (uint256) {
        return balanceERC1155 + handler.ghost_expectedERC1155Balances(account);
    }
}