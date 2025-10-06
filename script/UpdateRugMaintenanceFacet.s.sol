// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Update RugMaintenanceFacet
 * @dev Upgrade the RugMaintenanceFacet to fix time calculation bugs in cleanRug
 * @notice Fixes the * 1 days multipliers in internal _getDirtLevel and _getAgingLevel functions
 */
contract UpdateRugMaintenanceFacet is Script {
    // Shape Sepolia deployed addresses
    address constant DIAMOND_ADDR = 0xd750d12040E536E230aE989247Df7d89453e94d9;

    // Deployment addresses
    address public deployer;
    uint256 public deployerPrivateKey;

    function setUp() public {
        deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
    }

    function run() public {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Upgrading RugMaintenanceFacet on Shape Sepolia");
        console.log("=========================================");
        console.log("Diamond address:", DIAMOND_ADDR);

        // Deploy new RugMaintenanceFacet
        console.log("1. Deploying new RugMaintenanceFacet...");
        RugMaintenanceFacet newRugMaintenanceFacet = new RugMaintenanceFacet();
        address newFacetAddr = address(newRugMaintenanceFacet);
        console.log("   New RugMaintenanceFacet deployed at:", newFacetAddr);

        // Prepare facet cut for replacement
        console.log("2. Preparing facet cut for replacement...");
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMaintenanceSelectors()
        });

        // Execute upgrade
        console.log("3. Executing facet upgrade...");
        IDiamondCut(DIAMOND_ADDR).diamondCut(cuts, address(0), "");

        console.log("=========================================");
        console.log("RugMaintenanceFacet Upgrade Complete!");
        console.log("=========================================");
        console.log("Fixed: Removed incorrect * 1 days multipliers in _getDirtLevel");
        console.log("Fixed: Removed incorrect * 1 days multipliers in _getAgingLevel");
        console.log("Fixed: Added frame immunity to _getAgingLevel calculations");
        console.log("Fixed: cleanRug now only resets dirt, preserves aging level");
        console.log("Fixed: Dirt accumulation should work correctly after cleaning");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[8] = RugMaintenanceFacet.needsMasterRestoration.selector;
        return selectors;
    }
}