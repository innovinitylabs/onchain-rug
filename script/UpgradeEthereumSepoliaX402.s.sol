// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title Ethereum Sepolia X402 AI Maintenance Upgrade
 * @dev Upgrades Ethereum Sepolia with X402 AI maintenance features
 * @notice Adds AI-powered maintenance and enhanced admin features
 */
contract UpgradeEthereumSepoliaX402 is Script {
    address public diamondAddr;

    // New facet instances
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugAdminFacet public rugAdminFacet;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT");
        console.log("Upgrading Ethereum Sepolia with X402 AI maintenance at:", diamondAddr);

        console.log("1. Deploying updated facets with X402 features...");

        // Deploy updated facets with X402 AI maintenance capabilities
        rugMaintenanceFacet = new RugMaintenanceFacet();
        console.log("   RugMaintenanceFacet deployed at:", address(rugMaintenanceFacet));

        rugAdminFacet = new RugAdminFacet();
        console.log("   RugAdminFacet deployed at:", address(rugAdminFacet));

        console.log("2. Upgrading facets with X402 AI maintenance features...");

        // Upgrade RugMaintenanceFacet with X402 AI maintenance functions
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getX402MaintenanceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");
        console.log("   ✅ Added X402 AI maintenance functions to RugMaintenanceFacet");

        // Upgrade RugAdminFacet with X402 admin features
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getX402AdminSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(adminCut, address(0), "");
        console.log("   ✅ Added X402 admin enhancements to RugAdminFacet");

        console.log("3. X402 AI maintenance upgrade complete!");
        console.log("   ✅ Agent Management: authorizeMaintenanceAgent, getAuthorizedAgents, isAgentAuthorized");
        console.log("   ✅ Maintenance History: getMaintenanceHistory, getMaintenanceOptions");
        console.log("   ✅ AI Maintenance: Enhanced cleaning/restoration with AI insights");
        console.log("   ✅ Admin Controls: Advanced service fee management and AI integration");

        vm.stopBroadcast();
    }

    // X402 AI maintenance function selectors
    function _getX402MaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector; // 0x03b0b5cc
        selectors[1] = RugMaintenanceFacet.getAuthorizedAgents.selector;      // 0xc4e95962
        selectors[2] = RugMaintenanceFacet.isAgentAuthorized.selector;        // 0x66a685d5
        selectors[3] = RugMaintenanceFacet.getMaintenanceHistory.selector;    // 0x1d7b04a4
        selectors[4] = RugMaintenanceFacet.getMaintenanceOptions.selector;    // 0xda8a6973
        return selectors;
    }

    // X402 admin function selectors (subset of available admin functions)
    function _getX402AdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = RugAdminFacet.setServiceFee.selector;        // 0x4653cf90
        selectors[1] = RugAdminFacet.setFeeRecipient.selector;      // 0xc135cc5c
        selectors[2] = RugAdminFacet.updateAIServiceFee.selector;   // 0x7e01f35b
        return selectors;
    }
}