// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title UpdateRugAdminFacet
 * @notice Update RugAdminFacet with corrected documentation
 */
contract UpdateRugAdminFacet is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new RugAdminFacet with corrected docs
        RugAdminFacet newRugAdminFacet = new RugAdminFacet();
        address newFacetAddress = address(newRugAdminFacet);

        console.log("Deployed new RugAdminFacet at:", newFacetAddress);

        // Replace RugAdminFacet with updated version
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](17);

        // RugAdminFacet functions (17 total)
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
        selectors[16] = RugAdminFacet.isConfigured.selector;

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddress,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(DIAMOND).diamondCut(cut, address(0), "");

        console.log("RugAdminFacet replaced successfully!");
        console.log("Updated documentation: aging thresholds expect seconds, not days");

        vm.stopBroadcast();
    }
}
