// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import the diamond pattern
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/interfaces/IDiamondLoupe.sol";

// Import the facets to upgrade
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugAdminFacet.sol";

contract UpgradeToX402AIMaintenance is Script {
    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;
    address public diamondAddr;

    // Facet addresses
    RugMaintenanceFacet public maintenanceFacet;
    RugAdminFacet public adminFacet;

    function setUp() external {
        // Load private key
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);

        // Load diamond address from env
        diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");
        console.log("Upgrading diamond at:", diamondAddr);
    }

    function run() external {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("UPGRADING to x402 AI Maintenance Features");
        console.log("=========================================");

        // Deploy new facet instances
        console.log("1. Deploying updated facets...");
        maintenanceFacet = new RugMaintenanceFacet();
        adminFacet = new RugAdminFacet();
        console.log("   RugMaintenanceFacet:", address(maintenanceFacet));
        console.log("   RugAdminFacet:", address(adminFacet));

        // Get diamond cut interface
        IDiamondCut diamondCut = IDiamondCut(diamondAddr);

        // ===== UPGRADE RugMaintenanceFacet =====
        console.log("2. Upgrading RugMaintenanceFacet with AI agent functions...");
        bytes4[] memory maintenanceSelectors = _getMaintenanceSelectors();
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(maintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: maintenanceSelectors
        });
        diamondCut.diamondCut(maintenanceCut, address(0), "");
        console.log(string.concat("   [SUCCESS] RugMaintenanceFacet upgraded with ", vm.toString(maintenanceSelectors.length), " selectors"));

        // ===== UPGRADE RugAdminFacet =====
        console.log("3. Upgrading RugAdminFacet with fee configuration...");
        bytes4[] memory adminSelectors = _getAdminSelectors();
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(adminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: adminSelectors
        });
        diamondCut.diamondCut(adminCut, address(0), "");
        console.log(string.concat("   [SUCCESS] RugAdminFacet upgraded with ", vm.toString(adminSelectors.length), " selectors"));

        // ===== CONFIGURE INITIAL SETTINGS =====
        console.log("4. Configuring initial AI maintenance settings...");

        // Set fee recipient to deployer
        RugAdminFacet(diamondAddr).setFeeRecipient(deployer);
        console.log("   - Fee recipient set to deployer:", deployer);

        // Set service fees (example values - can be adjusted)
        uint256[3] memory fees = [
            uint256(0.001 ether), // cleanFee: 0.001 ETH
            uint256(0.002 ether), // restoreFee: 0.002 ETH
            uint256(0.005 ether)  // masterFee: 0.005 ETH
        ];
        RugAdminFacet(diamondAddr).setServiceFees(fees);
        console.log("   - Service fees configured:");
        console.log(string.concat("     * Clean fee: ", vm.toString(fees[0]), " wei"));
        console.log(string.concat("     * Restore fee: ", vm.toString(fees[1]), " wei"));
        console.log(string.concat("     * Master fee: ", vm.toString(fees[2]), " wei"));

        console.log("=========================================");
        console.log("[SUCCESS] UPGRADE COMPLETE!");
        console.log("=========================================");
        console.log("New features available:");
        console.log("- AI agent authorization (per-owner global)");
        console.log("- Single-transaction maintenance with service fees");
        console.log("- x402-compatible quote API endpoints");
        console.log("- Fee collection and configuration");
        console.log("");
        console.log("Diamond address:", diamondAddr);
        console.log("Deployer (fee recipient):", deployer);

        vm.stopBroadcast();
    }

    function _getMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);

        // NEW: Only add agent authorization + agent entrypoints (existing functions already registered)
        selectors[0] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[1] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[2] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[3] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[4] = RugMaintenanceFacet.masterRestoreRugAgent.selector;

        return selectors;
    }

    function _getAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);

        // NEW: Only add service fee configuration (existing functions already registered)
        selectors[0] = RugAdminFacet.setServiceFees.selector;
        selectors[1] = RugAdminFacet.setFeeRecipient.selector;
        selectors[2] = RugAdminFacet.getAgentServiceFees.selector;

        return selectors;
    }
}
