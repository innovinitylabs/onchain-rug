// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugMaintenanceFacet.sol";

contract UpgradeMaintenanceOnly is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new RugMaintenanceFacet
        RugMaintenanceFacet maintenanceFacet = new RugMaintenanceFacet();

        // Prepare diamond cut - REPLACE existing facet
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(maintenanceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: getSelectors()
        });

        // Execute diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        vm.stopBroadcast();
    }

    function getSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](24);

        // Agent authorization
        selectors[0] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[1] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[2] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        selectors[3] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;
        selectors[4] = RugMaintenanceFacet.isAgentAuthorized.selector;

        // Direct payment agent functions (NEW)
        selectors[5] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[6] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[7] = RugMaintenanceFacet.masterRestoreRugAgent.selector;

        // User direct payment functions
        selectors[8] = RugMaintenanceFacet.cleanRug.selector;
        selectors[9] = RugMaintenanceFacet.restoreRug.selector;
        selectors[10] = RugMaintenanceFacet.masterRestoreRug.selector;

        // Legacy authorized functions
        selectors[11] = RugMaintenanceFacet.cleanRugAuthorized.selector;
        selectors[12] = RugMaintenanceFacet.restoreRugAuthorized.selector;
        selectors[13] = RugMaintenanceFacet.masterRestoreRugAuthorized.selector;

        // Status and options
        selectors[14] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[15] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[16] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[17] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[18] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[19] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[20] = RugMaintenanceFacet.needsMasterRestoration.selector;

        // Maintenance history
        selectors[21] = RugMaintenanceFacet.getMaintenanceHistory.selector;

        // Authorization token functions (for compatibility)
        selectors[22] = RugMaintenanceFacet._verifyAuthorizationToken.selector;
        selectors[23] = RugMaintenanceFacet.isAuthorizationTokenValid.selector;

        return selectors;
    }
}
