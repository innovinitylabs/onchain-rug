// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugLaunderingFacet.sol";
import "../src/facets/RugAdminFacet.sol";

contract UpgradeMarketplaceWhitelist is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Upgrading facets with trusted marketplace whitelist support...");

        // Deploy new laundering facet with trusted marketplace support
        RugLaunderingFacet newLaunderingFacet = new RugLaunderingFacet();
        address launderingFacetAddr = address(newLaunderingFacet);
        console.log("New RugLaunderingFacet deployed at:", launderingFacetAddr);

        // Deploy new admin facet with marketplace whitelist functions
        RugAdminFacet newAdminFacet = new RugAdminFacet();
        address adminFacetAddr = address(newAdminFacet);
        console.log("New RugAdminFacet deployed at:", adminFacetAddr);

        // Prepare facet cuts - need separate cuts for existing and new functions
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](3);

        // Laundering facet replacement
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: launderingFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugLaunderingSelectors()
        });

        // Admin facet replacement (existing functions)
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: adminFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugAdminExistingSelectors()
        });

        // Admin facet addition (new marketplace whitelist functions)
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: adminFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAdminNewSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugLaunderingFacet and RugAdminFacet upgraded successfully with marketplace whitelist!");

        vm.stopBroadcast();
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);

        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        selectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        selectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        selectors[4] = RugLaunderingFacet.getLaunderingSaleHistory.selector;
        selectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        selectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingStats.selector;

        return selectors;
    }

    function _getRugAdminExistingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](22);
        
        selectors[0] = RugAdminFacet.updateMintPricing.selector;
        selectors[1] = RugAdminFacet.updateCollectionCap.selector;
        selectors[2] = RugAdminFacet.updateWalletLimit.selector;
        selectors[3] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[4] = RugAdminFacet.getAgingThresholds.selector;
        selectors[5] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[6] = RugAdminFacet.setLaunchStatus.selector;
        selectors[7] = RugAdminFacet.getMintPricing.selector;
        selectors[8] = RugAdminFacet.getConfig.selector;
        selectors[9] = RugAdminFacet.setScriptyContracts.selector;
        selectors[10] = RugAdminFacet.addToExceptionList.selector;
        selectors[11] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[12] = RugAdminFacet.getExceptionList.selector;
        selectors[13] = RugAdminFacet.getServicePricing.selector;
        selectors[14] = RugAdminFacet.updateServicePricing.selector;
        selectors[15] = RugAdminFacet.updateFrameThresholds.selector;
        selectors[16] = RugAdminFacet.updateAIServiceFee.selector;
        selectors[17] = RugAdminFacet.isConfigured.selector;
        selectors[18] = RugAdminFacet.setServiceFee.selector;
        selectors[19] = RugAdminFacet.setFeeRecipient.selector;
        selectors[20] = RugAdminFacet.getAgentServiceFee.selector;
        selectors[21] = RugAdminFacet.setERC721Metadata.selector;

        return selectors;
    }

    function _getRugAdminNewSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        
        // New marketplace whitelist functions
        selectors[0] = RugAdminFacet.addTrustedMarketplace.selector;
        selectors[1] = RugAdminFacet.removeTrustedMarketplace.selector;
        selectors[2] = RugAdminFacet.isTrustedMarketplace.selector;

        return selectors;
    }
}

