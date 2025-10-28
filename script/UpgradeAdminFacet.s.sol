// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAdminFacet.sol";

contract UpgradeAdminFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting RugAdminFacet upgrade...");

        // Deploy new admin facet
        RugAdminFacet newAdminFacet = new RugAdminFacet();
        address adminFacetAddr = address(newAdminFacet);
        console.log("New RugAdminFacet deployed at:", adminFacetAddr);

        // Prepare facet cuts for replacement
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

        // Admin facet replacement
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: adminFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugAdminSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("RugAdminFacet upgraded successfully");

        vm.stopBroadcast();
    }

    function _getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](16);

        // Admin functions
        selectors[0] = RugAdminFacet.updateCollectionCap.selector;
        selectors[1] = RugAdminFacet.updateWalletLimit.selector;
        selectors[2] = RugAdminFacet.updateMintPricing.selector;
        selectors[3] = RugAdminFacet.updateServicePricing.selector;
        selectors[4] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[5] = RugAdminFacet.updateFrameThresholds.selector;
        selectors[6] = RugAdminFacet.addToExceptionList.selector;
        selectors[7] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[8] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[9] = RugAdminFacet.setLaunchStatus.selector;
        selectors[10] = RugAdminFacet.getConfig.selector;
        selectors[11] = RugAdminFacet.getMintPricing.selector;
        selectors[12] = RugAdminFacet.getServicePricing.selector;
        selectors[13] = RugAdminFacet.getAgingThresholds.selector;
        selectors[14] = RugAdminFacet.getExceptionList.selector;
        selectors[15] = RugAdminFacet.setERC721Metadata.selector;

        return selectors;
    }
}
