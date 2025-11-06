// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import the diamond pattern
import "../src/diamond/interfaces/IDiamondCut.sol";

// Import the facets to upgrade
import "../src/facets/RugAdminFacet.sol";

contract UpgradeToFlatServiceFee is Script {
    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;
    address public diamondAddr;

    // Facet addresses
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
        console.log("UPGRADING to Flat Service Fee Structure");
        console.log("=========================================");

        // Deploy new facet instance
        console.log("1. Deploying updated RugAdminFacet...");
        adminFacet = new RugAdminFacet();
        console.log("   RugAdminFacet deployed at:", address(adminFacet));

        // Perform diamond cut
        console.log("2. Performing diamond cut...");

        // Remove old functions (hardcoded selectors from deployed contract)
        bytes4[] memory removeSelectors = new bytes4[](2);
        removeSelectors[0] = 0xc996ccd6; // setServiceFees(uint256[3])
        removeSelectors[1] = 0xa8e8232c; // getAgentServiceFees()

        IDiamondCut.FacetCut[] memory removeCuts = new IDiamondCut.FacetCut[](1);
        removeCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Remove functions
            action: IDiamondCut.FacetCutAction.Remove,
            functionSelectors: removeSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(removeCuts, address(0), "");
        console.log("   - Removed old service fee functions");

        // Add new functions
        bytes4[] memory addSelectors = new bytes4[](2);
        addSelectors[0] = RugAdminFacet.setServiceFee.selector;
        addSelectors[1] = RugAdminFacet.getAgentServiceFee.selector;

        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](1);
        addCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(adminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: addSelectors
        });

        IDiamondCut(diamondAddr).diamondCut(addCuts, address(0), "");
        console.log("   - Added new flat service fee functions");

        // ===== CONFIGURE FLAT FEE =====
        console.log("3. Configuring flat service fee...");

        uint256 flatServiceFee = uint256(0.00042 ether); // 0.00042 ETH
        RugAdminFacet(diamondAddr).setServiceFee(flatServiceFee);
        console.log("   - Set flat service fee to:", flatServiceFee, "wei (0.00042 ETH)");

        console.log("=========================================");
        console.log("[SUCCESS] FLAT FEE UPGRADE COMPLETE!");
        console.log("=========================================");
        console.log("Changes:");
        console.log("- Removed: setServiceFees() and getAgentServiceFees()");
        console.log("- Added: setServiceFee() and getAgentServiceFee()");
        console.log("- All maintenance actions now use flat 0.00042 ETH service fee");
    }
}
