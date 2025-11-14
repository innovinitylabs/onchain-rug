// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import the diamond pattern
import "../src/diamond/interfaces/IDiamondCut.sol";

// Import the facets to upgrade
import "../src/facets/RugMaintenanceFacet.sol";

contract UpgradeToAgentManagement is Script {
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
        console.log("UPGRADING to Agent Management Functions");
        console.log("=========================================");

        // Deploy new facet instance
        console.log("1. Deploying updated RugMaintenanceFacet...");
        maintenanceFacet = new RugMaintenanceFacet();
        console.log("   RugMaintenanceFacet deployed at:", address(maintenanceFacet));

        // Perform diamond cut
        console.log("2. Performing diamond cut...");

        // Add new agent management functions
        bytes4[] memory addSelectors = new bytes4[](2);
        addSelectors[0] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        addSelectors[1] = RugMaintenanceFacet.isAgentAuthorized.selector;

        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](1);
        addCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(maintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: addSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(addCuts, address(0), "");
        console.log("   - Added getAuthorizedAgents() function");
        console.log("   - Added isAgentAuthorized() function");

        console.log("=========================================");
        console.log("[SUCCESS] AGENT MANAGEMENT UPGRADE COMPLETE!");
        console.log("=========================================");
        console.log("New features available:");
        console.log("- getAuthorizedAgents(): View all authorized agents");
        console.log("- isAgentAuthorized(address): Check specific agent authorization");
        console.log("- Dashboard now shows authorized agents list with revoke functionality");
    }
}
