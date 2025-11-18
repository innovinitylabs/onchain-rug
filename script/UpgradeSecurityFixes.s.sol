// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";

/**
 * @title Upgrade Security Fixes
 * @notice Upgrades all facets with security fixes to Base Sepolia
 * @dev This script upgrades:
 *      - RugNFTFacet (text validation, seed generation improvements)
 *      - RugMarketplaceFacet (royalty DoS fix, price precision, approval race condition, refund fix, volume overflow)
 *      - RugCommerceFacet (pending royalties reentrancy fix)
 *      - RugMaintenanceFacet (token expiration logic fix)
 */
contract UpgradeSecurityFixes is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Upgrading Facets with Security Fixes");
        console.log("=========================================");
        console.log("Diamond Address:", diamondAddr);
        console.log("Network: Base Sepolia");

        // Deploy new facets with security fixes
        console.log("\n1. Deploying new facets...");
        
        RugNFTFacet newNftFacet = new RugNFTFacet();
        address nftFacetAddr = address(newNftFacet);
        console.log("   RugNFTFacet:", nftFacetAddr);

        RugMarketplaceFacet newMarketplaceFacet = new RugMarketplaceFacet();
        address marketplaceFacetAddr = address(newMarketplaceFacet);
        console.log("   RugMarketplaceFacet:", marketplaceFacetAddr);

        RugCommerceFacet newCommerceFacet = new RugCommerceFacet();
        address commerceFacetAddr = address(newCommerceFacet);
        console.log("   RugCommerceFacet:", commerceFacetAddr);

        RugMaintenanceFacet newMaintenanceFacet = new RugMaintenanceFacet();
        address maintenanceFacetAddr = address(newMaintenanceFacet);
        console.log("   RugMaintenanceFacet:", maintenanceFacetAddr);

        // Prepare facet cuts - need to separate Replace and Add actions
        console.log("\n2. Preparing facet cuts...");
        
        // First, replace existing facets
        IDiamondCut.FacetCut[] memory replaceCuts = new IDiamondCut.FacetCut[](4);

        // NFT facet replacement
        replaceCuts[0] = IDiamondCut.FacetCut({
            facetAddress: nftFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });
        console.log("   Prepared RugNFTFacet replacement");

        // Marketplace facet replacement
        replaceCuts[1] = IDiamondCut.FacetCut({
            facetAddress: marketplaceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getMarketplaceSelectors()
        });
        console.log("   Prepared RugMarketplaceFacet replacement");

        // Commerce facet replacement (existing functions only)
        replaceCuts[2] = IDiamondCut.FacetCut({
            facetAddress: commerceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getCommerceExistingSelectors()
        });
        console.log("   Prepared RugCommerceFacet replacement");

        // Maintenance facet replacement
        replaceCuts[3] = IDiamondCut.FacetCut({
            facetAddress: maintenanceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getMaintenanceSelectors()
        });
        console.log("   Prepared RugMaintenanceFacet replacement");

        // Execute replacement cuts
        console.log("\n3. Executing facet replacements...");
        IDiamondCut(diamondAddr).diamondCut(replaceCuts, address(0), "");
        console.log("   Facet replacements executed successfully");

        // Now add new functions (claimPendingRoyalties, getPendingRoyalties)
        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](1);
        addCuts[0] = IDiamondCut.FacetCut({
            facetAddress: commerceFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getCommerceNewSelectors()
        });
        console.log("   Prepared new RugCommerceFacet functions");

        // Execute add cuts
        console.log("\n4. Adding new functions...");
        IDiamondCut(diamondAddr).diamondCut(addCuts, address(0), "");
        console.log("   New functions added successfully");

        console.log("\n=========================================");
        console.log("Security Fixes Upgrade Complete!");
        console.log("=========================================");
        console.log("All facets upgraded with security fixes:");
        console.log("  - Marketplace Royalty DoS fix");
        console.log("  - Price precision loss fix");
        console.log("  - Approval race condition fix");
        console.log("  - Pending royalties reentrancy fix");
        console.log("  - Marketplace refund fix");
        console.log("  - Marketplace volume overflow fix");
        console.log("  - Token expiration logic fix");
        console.log("  - Text validation improvements");
        console.log("  - Seed generation improvements");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](32);
        // ERC721 Standard Functions (hardcoded selectors from forge inspect)
        selectors[0] = bytes4(0x70a08231); // balanceOf(address)
        selectors[1] = bytes4(0x6352211e); // ownerOf(uint256)
        selectors[2] = bytes4(0x42842e0e); // safeTransferFrom(address,address,uint256)
        selectors[3] = bytes4(0x23b872dd); // transferFrom(address,address,uint256)
        selectors[4] = bytes4(0x095ea7b3); // approve(address,uint256)
        selectors[5] = bytes4(0xa22cb465); // setApprovalForAll(address,bool)
        selectors[6] = bytes4(0x081812fc); // getApproved(uint256)
        selectors[7] = bytes4(0xe985e9c5); // isApprovedForAll(address,address)
        selectors[8] = bytes4(0x06fdde03); // name()
        selectors[9] = bytes4(0x95d89b41); // symbol()
        selectors[10] = bytes4(0xc87b56dd); // tokenURI(uint256)
        selectors[11] = bytes4(0x18160ddd); // totalSupply()
        selectors[12] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)

        // Rug-specific functions
        selectors[13] = RugNFTFacet.mintRug.selector;
        selectors[14] = RugNFTFacet.mintRugFor.selector;
        selectors[15] = RugNFTFacet.burn.selector;
        selectors[16] = RugNFTFacet.getRugData.selector;
        selectors[17] = RugNFTFacet.getAgingData.selector;
        selectors[18] = RugNFTFacet.getMintPrice.selector;
        selectors[19] = RugNFTFacet.canMint.selector;
        selectors[20] = RugNFTFacet.isTextAvailable.selector;
        selectors[21] = RugNFTFacet.maxSupply.selector;
        selectors[22] = RugNFTFacet.walletMints.selector;
        selectors[23] = RugNFTFacet.isWalletException.selector;

        // ERC721-C functions
        selectors[24] = RugNFTFacet.getTransferValidator.selector;
        selectors[25] = RugNFTFacet.getSecurityPolicy.selector;
        selectors[26] = RugNFTFacet.getWhitelistedOperators.selector;
        selectors[27] = RugNFTFacet.getPermittedContractReceivers.selector;
        selectors[28] = RugNFTFacet.isOperatorWhitelisted.selector;
        selectors[29] = RugNFTFacet.isContractReceiverPermitted.selector;
        selectors[30] = RugNFTFacet.isTransferAllowed.selector;

        // Initialization function
        selectors[31] = RugNFTFacet.initializeERC721Metadata.selector;

        return selectors;
    }

    function _getMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        selectors[4] = RugMarketplaceFacet.getListing.selector;
        selectors[5] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[6] = RugMarketplaceFacet.withdrawFees.selector;
        return selectors;
    }

    function _getCommerceExistingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](17);
        // Original selectors (existing in deployed contract)
        selectors[0] = RugCommerceFacet.withdraw.selector;
        selectors[1] = RugCommerceFacet.withdrawTo.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.royaltyInfo.selector;
        selectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[5] = RugCommerceFacet.getBalance.selector;
        selectors[6] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[7] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[8] = RugCommerceFacet.getRoyaltyRecipients.selector;
        selectors[9] = RugCommerceFacet.areRoyaltiesConfigured.selector;
        // Payment Processor integration selectors
        selectors[10] = RugCommerceFacet.setCollectionPricingBounds.selector;
        selectors[11] = RugCommerceFacet.setTokenPricingBounds.selector;
        selectors[12] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        selectors[13] = RugCommerceFacet.getCollectionPricingBounds.selector;
        selectors[14] = RugCommerceFacet.getTokenPricingBounds.selector;
        selectors[15] = RugCommerceFacet.isCollectionPricingImmutable.selector;
        selectors[16] = RugCommerceFacet.isTokenPricingImmutable.selector;
        return selectors;
    }

    function _getCommerceNewSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        // NEW: Pending royalties functions (security fixes)
        selectors[0] = RugCommerceFacet.claimPendingRoyalties.selector;
        selectors[1] = RugCommerceFacet.getPendingRoyalties.selector;
        return selectors;
    }

    function _getMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](19);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[8] = RugMaintenanceFacet.needsMasterRestoration.selector;
        selectors[9] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[10] = RugMaintenanceFacet.getMaintenanceHistory.selector;
        // Agent authorization + agent entrypoints
        selectors[11] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[12] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[13] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[14] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[15] = RugMaintenanceFacet.masterRestoreRugAgent.selector;
        // Agent management functions
        selectors[16] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        selectors[17] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;
        selectors[18] = RugMaintenanceFacet.isAgentAuthorized.selector;
        return selectors;
    }
}

