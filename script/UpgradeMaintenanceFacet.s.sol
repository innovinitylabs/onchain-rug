// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/facets/RugNFTFacet.sol";

contract UpgradeMaintenanceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying new RugMaintenanceFacet...");

        // Deploy new facet
        RugMaintenanceFacet newMaintenanceFacet = new RugMaintenanceFacet();

        console.log("RugMaintenanceFacet deployed at:", address(newMaintenanceFacet));

        // Prepare facet cut
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // Maintenance facet replacement with direct payment functions
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(newMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugMaintenanceSelectors()
        });

        // Execute diamond cut
        console.log("Executing diamond cut...");
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("Maintenance facet upgrade complete!");

        vm.stopBroadcast();
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](23);

        // Agent authorization (kept)
        selectors[0] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[1] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[2] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        selectors[3] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;
        selectors[4] = RugMaintenanceFacet.isAgentAuthorized.selector;

        // Direct payment agent functions (updated)
        selectors[5] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[6] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[7] = RugMaintenanceFacet.masterRestoreRugAgent.selector;

        // User direct payment (kept)
        selectors[8] = RugMaintenanceFacet.cleanRug.selector;

        // Legacy authorized functions (kept for compatibility)
        selectors[9] = RugMaintenanceFacet.cleanRugAuthorized.selector;
        selectors[10] = RugMaintenanceFacet.restoreRugAuthorized.selector;
        selectors[11] = RugMaintenanceFacet.masterRestoreRugAuthorized.selector;

        // Status and options (kept)
        selectors[12] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[13] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[14] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[15] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[16] = RugMaintenanceFacet.getTotalCleaningCost.selector;
        selectors[17] = RugMaintenanceFacet.getTotalRestorationCost.selector;
        selectors[18] = RugMaintenanceFacet.getTotalMasterRestorationCost.selector;

        // Cost calculation (kept)
        selectors[19] = RugMaintenanceFacet.calculateServiceFee.selector;
        selectors[20] = RugMaintenanceFacet.calculateTotalCost.selector;

        // Admin functions (kept)
        selectors[21] = RugMaintenanceFacet.setMaintenanceParams.selector;
        selectors[22] = RugMaintenanceFacet.getMaintenanceParams.selector;

        return selectors;
    }

    function _getRugMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](13);
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        selectors[4] = RugMarketplaceFacet.makeOffer.selector;
        selectors[5] = RugMarketplaceFacet.acceptOffer.selector;
        selectors[6] = RugMarketplaceFacet.cancelOffer.selector;
        selectors[7] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[8] = RugMarketplaceFacet.withdrawFees.selector;
        selectors[9] = RugMarketplaceFacet.getListing.selector;
        selectors[10] = RugMarketplaceFacet.getMarketplaceStats.selector;
        selectors[11] = RugMarketplaceFacet.getOffer.selector;
        selectors[12] = RugMarketplaceFacet.getActiveTokenOffers.selector;
        return selectors;
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](18);
        selectors[0] = RugNFTFacet.ownerOf.selector;
        selectors[1] = RugNFTFacet.balanceOf.selector;
        selectors[2] = RugNFTFacet.approve.selector;
        selectors[3] = RugNFTFacet.getApproved.selector;
        selectors[4] = RugNFTFacet.setApprovalForAll.selector;
        selectors[5] = RugNFTFacet.isApprovedForAll.selector;
        selectors[6] = RugNFTFacet.transferFrom.selector;
        selectors[7] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        selectors[8] = 0xb88d4fde; // safeTransferFrom(address,address,uint256,bytes)
        selectors[9] = RugNFTFacet.name.selector;
        selectors[10] = RugNFTFacet.symbol.selector;
        selectors[11] = RugNFTFacet.tokenURI.selector;
        selectors[12] = RugNFTFacet.totalSupply.selector;
        selectors[13] = RugNFTFacet.supportsInterface.selector;
        selectors[14] = RugNFTFacet.mintRug.selector;
        selectors[15] = RugNFTFacet.burn.selector;
        selectors[16] = RugNFTFacet.getRugData.selector;
        selectors[17] = RugNFTFacet.getAgingData.selector;
        return selectors;
    }
}

