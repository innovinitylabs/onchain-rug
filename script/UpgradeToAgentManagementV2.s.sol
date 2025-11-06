// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import the diamond pattern
import "../src/diamond/interfaces/IDiamondCut.sol";

// Import the facets to upgrade
import "../src/facets/RugMaintenanceFacet.sol";

contract UpgradeToAgentManagementV2 is Script {
    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;
    address public diamondAddr;

    // Facet addresses
    RugMaintenanceFacet public maintenanceFacet;

    function setUp() external {
        // Load private key
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);

        // Load diamond address from env or use default
        try vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT") returns (address addr) {
            diamondAddr = addr;
        } catch {
            // Default to Shape Sepolia if not set
            diamondAddr = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325;
        }
        console.log("Upgrading diamond at:", diamondAddr);
    }

    function run() external {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("UPGRADING to Agent Management V2");
        console.log("=========================================");

        // Deploy new facet instance
        console.log("1. Deploying updated RugMaintenanceFacet...");
        maintenanceFacet = new RugMaintenanceFacet();
        console.log("   RugMaintenanceFacet deployed at:", address(maintenanceFacet));

        // Perform diamond cut
        console.log("2. Performing diamond cut...");

        // Add new agent management function
        bytes4[] memory addSelectors = new bytes4[](1);
        addSelectors[0] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;

        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](1);
        addCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(maintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: addSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(addCuts, address(0), "");
        console.log("   - Added getAuthorizedAgentsFor(address) function");

        console.log("=========================================");
        console.log("[SUCCESS] AGENT MANAGEMENT V2 UPGRADE COMPLETE!");
        console.log("=========================================");
        console.log("New features available:");
        console.log("- getAuthorizedAgentsFor(address): Get agents for specific owner");
        console.log("- Dashboard now properly shows authorized agents");
    }
}
