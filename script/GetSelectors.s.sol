// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";

contract GetSelectors is Script {
    function run() external view {
        console.log("RugMaintenanceFacet Function Selectors:");
        console.log("authorizeMaintenanceAgent:", RugMaintenanceFacet.authorizeMaintenanceAgent.selector);
        console.log("revokeMaintenanceAgent:", RugMaintenanceFacet.revokeMaintenanceAgent.selector);
        console.log("getAuthorizedAgents:", RugMaintenanceFacet.getAuthorizedAgents.selector);
        console.log("getAuthorizedAgentsFor:", RugMaintenanceFacet.getAuthorizedAgentsFor.selector);
        console.log("isAgentAuthorized:", RugMaintenanceFacet.isAgentAuthorized.selector);
        console.log("cleanRugAgent:", RugMaintenanceFacet.cleanRugAgent.selector);
        console.log("restoreRugAgent:", RugMaintenanceFacet.restoreRugAgent.selector);
        console.log("masterRestoreRugAgent:", RugMaintenanceFacet.masterRestoreRugAgent.selector);
        console.log("cleanRug:", RugMaintenanceFacet.cleanRug.selector);
        console.log("restoreRug:", RugMaintenanceFacet.restoreRug.selector);
        console.log("masterRestoreRug:", RugMaintenanceFacet.masterRestoreRug.selector);
        console.log("cleanRugAuthorized:", RugMaintenanceFacet.cleanRugAuthorized.selector);
        console.log("restoreRugAuthorized:", RugMaintenanceFacet.restoreRugAuthorized.selector);
        console.log("masterRestoreRugAuthorized:", RugMaintenanceFacet.masterRestoreRugAuthorized.selector);
        console.log("getMaintenanceOptions:", RugMaintenanceFacet.getMaintenanceOptions.selector);
        console.log("getCleaningCost:", RugMaintenanceFacet.getCleaningCost.selector);
        console.log("getRestorationCost:", RugMaintenanceFacet.getRestorationCost.selector);
        console.log("getMasterRestorationCost:", RugMaintenanceFacet.getMasterRestorationCost.selector);
        console.log("canCleanRug:", RugMaintenanceFacet.canCleanRug.selector);
        console.log("canRestoreRug:", RugMaintenanceFacet.canRestoreRug.selector);
        console.log("needsMasterRestoration:", RugMaintenanceFacet.needsMasterRestoration.selector);
        console.log("getMaintenanceHistory:", RugMaintenanceFacet.getMaintenanceHistory.selector);
        console.log("_verifyAuthorizationToken:", RugMaintenanceFacet._verifyAuthorizationToken.selector);
        console.log("isAuthorizationTokenValid:", RugMaintenanceFacet.isAuthorizationTokenValid.selector);
    }
}
