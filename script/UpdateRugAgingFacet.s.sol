// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Update RugAgingFacet
 * @dev Upgrade the RugAgingFacet to fix time calculation bugs
 * @notice Fixes the * 1 days multipliers that were causing incorrect timing
 */
contract UpdateRugAgingFacet is Script {
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
        console.log("Upgrading RugAgingFacet on Shape Sepolia");
        console.log("=========================================");
        console.log("Diamond address:", DIAMOND_ADDR);

        // Deploy new RugAgingFacet
        console.log("1. Deploying new RugAgingFacet...");
        RugAgingFacet newRugAgingFacet = new RugAgingFacet();
        address newFacetAddr = address(newRugAgingFacet);
        console.log("   New RugAgingFacet deployed at:", newFacetAddr);

        // Prepare facet cut for replacement
        console.log("2. Preparing facet cut for replacement...");
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugAgingSelectors()
        });

        // Execute upgrade
        console.log("3. Executing facet upgrade...");
        IDiamondCut(DIAMOND_ADDR).diamondCut(cuts, address(0), "");

        console.log("=========================================");
        console.log("RugAgingFacet Upgrade Complete!");
        console.log("=========================================");
        console.log("Fixed: Removed incorrect * 1 days multipliers");
        console.log("Fixed: Time calculations now use config values directly");
        console.log("Fixed: Dirt and aging progression should now work correctly");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = RugAgingFacet.getDirtLevel.selector;
        selectors[1] = RugAgingFacet.getAgingLevel.selector;
        selectors[2] = RugAgingFacet.getFrameLevel.selector;
        selectors[3] = RugAgingFacet.getFrameName.selector;
        selectors[4] = RugAgingFacet.getMaintenanceScore.selector;
        selectors[5] = RugAgingFacet.hasDirt.selector;
        selectors[6] = RugAgingFacet.isCleaningFree.selector;
        selectors[7] = RugAgingFacet.timeUntilNextAging.selector;
        return selectors;
    }
}
