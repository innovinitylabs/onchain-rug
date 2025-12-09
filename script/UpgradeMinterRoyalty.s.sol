// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugCommerceFacet.sol";

/**
 * @title Upgrade Minter Royalty Distribution
 * @notice Upgrades RugCommerceFacet to include minter royalty distribution (1% to minter, 8% to user, 1% to pool)
 * @dev This script upgrades the RugCommerceFacet to distribute royalties as:
 *      - 1% to minter/curator (from NFT's curator field)
 *      - 8% to configured recipients (user)
 *      - 1% to Diamond Frame Pool
 */
contract UpgradeMinterRoyalty is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Upgrading RugCommerceFacet with Minter Royalty");
        console.log("=========================================");
        console.log("Diamond Address:", diamondAddr);
        console.log("Network: Base Sepolia");

        // Deploy new commerce facet with minter royalty distribution
        console.log("\n1. Deploying new RugCommerceFacet...");
        
        RugCommerceFacet newCommerceFacet = new RugCommerceFacet();
        address commerceFacetAddr = address(newCommerceFacet);
        console.log("   RugCommerceFacet:", commerceFacetAddr);

        // Prepare facet cut for replacement
        console.log("\n2. Preparing facet cut...");
        
        IDiamondCut.FacetCut[] memory replaceCuts = new IDiamondCut.FacetCut[](1);

        // Commerce facet replacement
        replaceCuts[0] = IDiamondCut.FacetCut({
            facetAddress: commerceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getCommerceSelectors()
        });
        console.log("   Prepared RugCommerceFacet replacement");

        // Execute replacement cut
        console.log("\n3. Executing facet replacement...");
        IDiamondCut(diamondAddr).diamondCut(replaceCuts, address(0), "");
        console.log("   Facet replacement executed successfully");

        console.log("\n=========================================");
        console.log("Minter Royalty Upgrade Complete!");
        console.log("=========================================");
        console.log("Royalty distribution updated:");
        console.log("  - 1% to minter/curator (from NFT)");
        console.log("  - 8% to configured recipients (user)");
        console.log("  - 1% to Diamond Frame Pool");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](30);
        
        // Royalty functions
        selectors[0] = RugCommerceFacet.royaltyInfo.selector;
        selectors[1] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[4] = RugCommerceFacet.getRoyaltyRecipients.selector;
        selectors[5] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[6] = RugCommerceFacet.areRoyaltiesConfigured.selector;
        selectors[7] = RugCommerceFacet.claimPendingRoyalties.selector;
        selectors[8] = RugCommerceFacet.getPendingRoyalties.selector;
        
        // Pool functions
        selectors[9] = RugCommerceFacet.setPoolContract.selector;
        selectors[10] = RugCommerceFacet.setPoolPercentage.selector;
        selectors[11] = RugCommerceFacet.getPoolConfig.selector;
        selectors[12] = RugCommerceFacet.emergencyWithdrawFromPool.selector;
        selectors[13] = RugCommerceFacet.claimPoolRoyalties.selector;
        
        // Withdrawal functions
        selectors[14] = RugCommerceFacet.withdraw.selector;
        selectors[15] = RugCommerceFacet.withdrawTo.selector;
        selectors[16] = RugCommerceFacet.getBalance.selector;
        
        // Payment Processor functions
        selectors[17] = RugCommerceFacet.setCollectionPricingBounds.selector;
        selectors[18] = RugCommerceFacet.setTokenPricingBounds.selector;
        selectors[19] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        selectors[20] = RugCommerceFacet.getCollectionPricingBounds.selector;
        selectors[21] = RugCommerceFacet.getTokenPricingBounds.selector;
        selectors[22] = RugCommerceFacet.isCollectionPricingImmutable.selector;
        selectors[23] = RugCommerceFacet.isTokenPricingImmutable.selector;
        selectors[24] = RugCommerceFacet.getApprovedPaymentCoin.selector;
        
        // Sale history
        selectors[25] = RugCommerceFacet.getSaleHistory.selector;
        
        return selectors;
    }
}

