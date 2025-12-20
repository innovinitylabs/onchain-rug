// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugReferralRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title Upgrade Base Sepolia for ERC-8021 & Referral System
 * @dev Upgrades existing facets and adds new RugReferralRegistryFacet
 */
contract UpgradeBaseSepoliaERC8021 is Script {
    address public diamondAddr;
    
    // New facet instances
    RugNFTFacet public rugNFTFacet;
    RugMarketplaceFacet public rugMarketplaceFacet;
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugReferralRegistryFacet public rugReferralRegistryFacet;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address from environment
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Upgrading diamond at:", diamondAddr);

        console.log("1. Deploying updated facets...");
        
        // Deploy updated facets (with ERC-8021 and referral integration)
        rugNFTFacet = new RugNFTFacet();
        console.log("   RugNFTFacet deployed at:", address(rugNFTFacet));
        
        rugMarketplaceFacet = new RugMarketplaceFacet();
        console.log("   RugMarketplaceFacet deployed at:", address(rugMarketplaceFacet));
        
        rugMaintenanceFacet = new RugMaintenanceFacet();
        console.log("   RugMaintenanceFacet deployed at:", address(rugMaintenanceFacet));
        
        // Deploy new referral registry facet
        rugReferralRegistryFacet = new RugReferralRegistryFacet();
        console.log("   RugReferralRegistryFacet deployed at:", address(rugReferralRegistryFacet));

        console.log("2. Upgrading existing facets...");
        
        // Upgrade RugNFTFacet (add ERC-8021 parsing and referral rewards)
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(nftCut, address(0), "");
        console.log("   RugNFTFacet upgraded");

        // Upgrade RugMarketplaceFacet (add ERC-8021 parsing and referral rewards)
        // Replace all marketplace functions (existing + new offer functions)
        IDiamondCut.FacetCut[] memory marketplaceCut = new IDiamondCut.FacetCut[](1);
        marketplaceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMarketplaceReplaceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(marketplaceCut, address(0), "");
        console.log("   RugMarketplaceFacet upgraded");
        
        // Note: Offer functions (makeOffer, acceptOffer, etc.) will be added separately if needed
        // They're new functions that may not exist in the original deployment

        // Upgrade RugMaintenanceFacet (add ERC-8021 attribution tracking)
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMaintenanceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");
        console.log("   RugMaintenanceFacet upgraded");

        console.log("3. Adding new RugReferralRegistryFacet...");
        
        // Add new referral registry facet
        IDiamondCut.FacetCut[] memory referralCut = new IDiamondCut.FacetCut[](1);
        referralCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugReferralRegistryFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugReferralRegistrySelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(referralCut, address(0), "");
        console.log("   RugReferralRegistryFacet added");

        console.log("4. Initializing referral system...");
        
        // Initialize referral system with 5% default percentages
        RugReferralRegistryFacet(diamondAddr).initializeReferralSystem();
        console.log("   Referral system initialized with 5% defaults");

        // Set referral percentages to 5% (500 basis points) for both mint and marketplace
        RugReferralRegistryFacet(diamondAddr).setReferralPercentages(500, 500);
        console.log("   Referral percentages set to 5% (500 basis points)");

        console.log("5. Configuration complete!");
        console.log("   - ERC-8021 attribution parsing enabled");
        console.log("   - Referral registry active");
        console.log("   - Referral rewards: 5% mint, 5% marketplace");
        console.log("   - Note: Referral system is disabled by default (enable via setReferralSystemEnabled(true))");

        vm.stopBroadcast();
    }

    // Selector functions (reuse from deployment script pattern)
    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](32);
        // ERC721 Standard Functions
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

    // Selectors for functions that existed in original deployment (for Replace)
    function _getRugMarketplaceReplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        // Listing functions (existed originally)
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        // View functions (existed originally)
        selectors[4] = RugMarketplaceFacet.getListing.selector;
        selectors[5] = RugMarketplaceFacet.getMarketplaceStats.selector;
        // Admin functions (existed originally)
        selectors[6] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[7] = RugMarketplaceFacet.withdrawFees.selector;
        return selectors;
    }

    // Selectors for new functions that need to be added
    function _getRugMarketplaceAddSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](6);
        // Offer functions (new)
        selectors[0] = RugMarketplaceFacet.makeOffer.selector;
        selectors[1] = RugMarketplaceFacet.acceptOffer.selector;
        selectors[2] = RugMarketplaceFacet.cancelOffer.selector;
        // View functions (new)
        selectors[3] = RugMarketplaceFacet.getOffer.selector;
        selectors[4] = RugMarketplaceFacet.getTokenOffers.selector;
        selectors[5] = RugMarketplaceFacet.getActiveTokenOffers.selector;
        return selectors;
    }

    function _getMarketplaceAddCut() internal view returns (IDiamondCut.FacetCut[] memory) {
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugMarketplaceAddSelectors()
        });
        return cuts;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
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

    function _getRugReferralRegistrySelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](14);
        selectors[0] = RugReferralRegistryFacet.registerReferralCode.selector;
        selectors[1] = RugReferralRegistryFacet.getReferrerFromCode.selector;
        selectors[2] = RugReferralRegistryFacet.getCodeFromReferrer.selector;
        selectors[3] = RugReferralRegistryFacet.codeExists.selector;
        selectors[4] = RugReferralRegistryFacet.getReferralStats.selector;
        selectors[5] = RugReferralRegistryFacet.getReferralConfig.selector;
        selectors[6] = RugReferralRegistryFacet.extractReferrerFromCodes.selector;
        selectors[7] = RugReferralRegistryFacet.recordReferral.selector;
        selectors[8] = RugReferralRegistryFacet.calculateMintReferralReward.selector;
        selectors[9] = RugReferralRegistryFacet.calculateMarketplaceReferralReward.selector;
        selectors[10] = RugReferralRegistryFacet.setReferralSystemEnabled.selector;
        selectors[11] = RugReferralRegistryFacet.setReferralPercentages.selector;
        selectors[12] = RugReferralRegistryFacet.setCodeLengthLimits.selector;
        selectors[13] = RugReferralRegistryFacet.initializeReferralSystem.selector;
        return selectors;
    }
}

