// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract UpgradeMaintenanceFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Upgrading maintenance facet to direct payment system...");

        // Use the already deployed maintenance facet with direct payment system
        address maintenanceFacetAddr = 0xeBfD53cD9781E1F2D0cB7EFd7cBE6Dc7878836C8;

        console.log("Using RugMaintenanceFacet at:", maintenanceFacetAddr);

        // Step 1: Remove old token-based agent functions
        IDiamondCut.FacetCut[] memory removeCuts = new IDiamondCut.FacetCut[](1);
        removeCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(0), // Must be address(0) for Remove
            action: IDiamondCut.FacetCutAction.Remove,
            functionSelectors: _getOldTokenBasedSelectors()
        });

        console.log("Step 1: Removing old token-based agent functions...");
        IDiamondCut(diamondAddr).diamondCut(removeCuts, address(0), "");

        // Step 2: Add new direct payment agent functions
        IDiamondCut.FacetCut[] memory addCuts = new IDiamondCut.FacetCut[](1);
        addCuts[0] = IDiamondCut.FacetCut({
            facetAddress: maintenanceFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getNewDirectPaymentSelectors()
        });

        console.log("Step 2: Adding new direct payment agent functions...");
        IDiamondCut(diamondAddr).diamondCut(addCuts, address(0), "");

        // Step 3: Replace authorization/status functions (but NOT core user functions)
        IDiamondCut.FacetCut[] memory replaceCuts = new IDiamondCut.FacetCut[](1);
        replaceCuts[0] = IDiamondCut.FacetCut({
            facetAddress: maintenanceFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getAuthorizationAndStatusSelectors()
        });

        console.log("Step 3: Replacing authorization and status functions...");
        IDiamondCut(diamondAddr).diamondCut(replaceCuts, address(0), "");

        console.log("Maintenance facet upgraded successfully!");
        console.log("New maintenance facet:", maintenanceFacetAddr);
        console.log("Old token-based functions removed, new direct payment functions added");
        console.log("Core user functions (cleanRug, restoreRug, masterRestoreRug) remain unchanged");

        vm.stopBroadcast();
    }

    // Old token-based agent functions that need to be REMOVED
    function _getOldTokenBasedSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);

        // Old token-based agent functions (to be removed)
        selectors[0] = 0xce812966; // cleanRugAgent(uint256,bytes32,string,uint256)
        selectors[1] = 0xb28a8bbd; // restoreRugAgent(uint256,bytes32,string,uint256)
        selectors[2] = 0x676f2176; // masterRestoreRugAgent(uint256,bytes32,string,uint256)

        return selectors;
    }

    // New direct payment agent functions that need to be ADDED
    function _getNewDirectPaymentSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](6);

        // New direct payment agent functions
        selectors[0] = 0x66a685d5; // cleanRugAgent(uint256)
        selectors[1] = 0x1d7b04a4; // restoreRugAgent(uint256)
        selectors[2] = 0xda8a6973; // masterRestoreRugAgent(uint256)

        // Legacy authorized functions (kept for compatibility)
        selectors[3] = 0x68e36c3d; // cleanRugAuthorized(uint256)
        selectors[4] = 0xe13807fc; // restoreRugAuthorized(uint256)
        selectors[5] = 0x2b4bc5ab; // masterRestoreRugAuthorized(uint256)

        return selectors;
    }

    // Authorization and status functions that need to be REPLACED (but NOT core user functions)
    // Core functions (cleanRug, restoreRug, masterRestoreRug) should NOT be replaced - they're for website users
    // 
    // IMPORTANT: Agent authorization functions are critical because:
    // - Agents don't hold the NFTs themselves
    // - Owners can authorize specific wallets to perform maintenance on behalf of the owner
    // - This allows authorized agents to call cleanRugAgent/restoreRugAgent even without owning the NFT
    function _getAuthorizationAndStatusSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);

        // Agent authorization functions (CRITICAL - allows owners to authorize agents to maintain NFTs they don't own)
        selectors[0] = 0x03b0b5cc; // authorizeMaintenanceAgent(address) - Owner authorizes an agent wallet
        selectors[1] = 0xc4e95962; // revokeMaintenanceAgent(address) - Owner revokes agent authorization
        selectors[2] = 0xd8638e56; // getAuthorizedAgents() - Get all agents authorized by caller
        selectors[3] = 0xadb364dd; // getAuthorizedAgentsFor(address) - Get agents authorized by specific owner
        selectors[4] = 0xb326b99a; // isAgentAuthorized(address) - Check if agent is authorized for caller

        // Status and cost functions (these can be updated)
        selectors[5] = 0x7eeafdbc; // getMaintenanceOptions(uint256)
        selectors[6] = 0x6c174ed8; // getCleaningCost(uint256)
        selectors[7] = 0x40a9c122; // getRestorationCost(uint256)
        selectors[8] = 0x234e4777; // getMasterRestorationCost(uint256)
        selectors[9] = 0x89d929be; // canCleanRug(uint256)

        return selectors;
    }

}

