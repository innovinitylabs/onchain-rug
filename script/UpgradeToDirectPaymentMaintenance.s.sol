// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import the diamond pattern
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/interfaces/IDiamondLoupe.sol";

// Import the facets to upgrade
import "../src/facets/RugMaintenanceFacet.sol";

contract UpgradeToDirectPaymentMaintenance is Script {
    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;
    address public diamondAddr;

    // Facet addresses
    RugMaintenanceFacet public maintenanceFacet;

    function setUp() external {
        // Load private key
        deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);

        // Load diamond address from env
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Upgrading diamond at:", diamondAddr);
    }

    function run() external {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("UPGRADING to Direct Payment Maintenance");
        console.log("=========================================");

        // Deploy new facet instance
        console.log("1. Deploying updated RugMaintenanceFacet...");
        maintenanceFacet = new RugMaintenanceFacet();
        console.log("   RugMaintenanceFacet:", address(maintenanceFacet));

        // Get diamond cut interface
        IDiamondCut diamondCut = IDiamondCut(diamondAddr);

        // ===== REPLACE RugMaintenanceFacet =====
        console.log("2. Replacing RugMaintenanceFacet with direct payment functions...");
        bytes4[] memory maintenanceSelectors = _getMaintenanceSelectors();
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(maintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: maintenanceSelectors
        });
        diamondCut.diamondCut(maintenanceCut, address(0), "");
        console.log(string.concat("   [SUCCESS] RugMaintenanceFacet replaced with ", vm.toString(maintenanceSelectors.length), " selectors"));

        console.log("=========================================");
        console.log("[SUCCESS] UPGRADE COMPLETE!");
        console.log("=========================================");
        console.log("New features available:");
        console.log("- Direct payment agent maintenance (no tokens/keys)");
        console.log("- On-chain payment verification");
        console.log("- Automatic fee collection and distribution");
        console.log("- Enhanced security (no facilitator dependency)");
        console.log("");
        console.log("Security improvements:");
        console.log("- Eliminated facilitator 'keys' vulnerability");
        console.log("- Direct contract payments with on-chain verification");
        console.log("- Maintained agent authorization system");
        console.log("- Automatic excess payment refunds");

        vm.stopBroadcast();
    }

    function _getMaintenanceSelectors() internal pure returns (bytes4[] memory) {
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
}
