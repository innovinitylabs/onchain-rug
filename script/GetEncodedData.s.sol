// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";

contract GetEncodedData is Script {
    function run() external view {
        // New facet address
        address newFacet = 0xeBfD53cD9781E1F2D0cB7EFd7cBE6Dc7878836C8;

        // Create facet cut
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: newFacet,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: getSelectors()
        });

        // Encode the function call
        bytes memory data = abi.encodeWithSelector(
            0x1f931c1c, // diamondCut selector
            cuts,
            address(0),
            ""
        );

        console.log("Encoded diamond cut data:");
        console.logBytes(data);
        console.log("");
        console.log("Send this to:", 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff);
    }

    function getSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](24);

        selectors[0] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[1] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[2] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        selectors[3] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;
        selectors[4] = RugMaintenanceFacet.isAgentAuthorized.selector;
        selectors[5] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[6] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[7] = RugMaintenanceFacet.masterRestoreRugAgent.selector;
        selectors[8] = RugMaintenanceFacet.cleanRug.selector;
        selectors[9] = RugMaintenanceFacet.restoreRug.selector;
        selectors[10] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[11] = RugMaintenanceFacet.cleanRugAuthorized.selector;
        selectors[12] = RugMaintenanceFacet.restoreRugAuthorized.selector;
        selectors[13] = RugMaintenanceFacet.masterRestoreRugAuthorized.selector;
        selectors[14] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[15] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[16] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[17] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[18] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[19] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[20] = RugMaintenanceFacet.needsMasterRestoration.selector;
        selectors[21] = RugMaintenanceFacet.getMaintenanceHistory.selector;
        selectors[22] = RugMaintenanceFacet._verifyAuthorizationToken.selector;
        selectors[23] = RugMaintenanceFacet.isAuthorizationTokenValid.selector;

        return selectors;
    }
}

interface IDiamondCut {
    enum FacetCutAction { Add, Replace, Remove }
    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }
    function diamondCut(FacetCut[] calldata _diamondCut, address _init, bytes calldata _calldata) external;
}
