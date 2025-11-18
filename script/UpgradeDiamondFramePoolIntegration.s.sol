// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/diamond/facets/DiamondLoupeFacet.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";
import "../src/facets/RugTransferSecurityFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/libraries/LibRugStorage.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Diamond Frame Pool Integration Upgrade Script
 * @dev Upgrades existing Base Sepolia deployment with Diamond Frame Pool functionality
 * @notice Updates facets with diamond frame tracking and deploys new pool contract
 */
contract UpgradeDiamondFramePoolIntegration is Script {
    // Existing deployed contracts (Base Sepolia addresses)
    address public constant EXISTING_DIAMOND = 0x15c5a551b8aA39a3A4E73643a681E71F76093b62; // Base Sepolia diamond

    // Deployed addresses
    address public poolAddr;
    address public deployer;

    // Configuration
    uint256 public deployerPrivateKey;
    uint256 public constant POOL_PERCENTAGE = 100; // 1% of royalties (100 basis points)
    uint256 public constant MINIMUM_CLAIMABLE_AMOUNT = 0.001 ether; // Minimum claimable amount

    function setUp() public {
        // Try TESTNET_PRIVATE_KEY first, fallback to PRIVATE_KEY
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
    }

    function run() public {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Diamond Frame Pool Integration Upgrade");
        console.log("=========================================");

        // Step 1: Deploy new DiamondFramePool contract first
        console.log("Step 1: Deploying DiamondFramePool contract...");
        deployPoolContract();

        // Step 2: Upgrade existing facets with diamond frame functionality
        console.log("Step 2: Upgrading facets with diamond frame functionality...");
        upgradeFacets();

        // Step 3: Configure pool in the diamond
        console.log("Step 3: Configuring pool in diamond...");
        configurePool();

        console.log("=========================================");
        console.log("Upgrade Complete!");
        console.log("=========================================");
        console.log("DiamondFramePool deployed at:", poolAddr);
        console.log("Pool configured with 1% royalty percentage");
        console.log("Minimum claimable amount:", MINIMUM_CLAIMABLE_AMOUNT / 1e18, "ETH");

        vm.stopBroadcast();
    }

    function deployPoolContract() internal {
        console.log("   Using pre-deployed DiamondFramePool contract...");

        // Use the already deployed pool contract address
        poolAddr = 0x6Ca52DE430F39bC82E372149cC1e54f6277b6D9A;

        console.log("   DiamondFramePool address:", poolAddr);
        console.log("   Diamond address:", EXISTING_DIAMOND);
        console.log("   Minimum claimable amount:", MINIMUM_CLAIMABLE_AMOUNT / 1e18, "ETH");
    }

    function upgradeFacets() internal {
        console.log("2. Upgrading facets with diamond frame functionality...");

        // Deploy updated facets
        RugAgingFacet newAgingFacet = new RugAgingFacet();
        RugMaintenanceFacet newMaintenanceFacet = new RugMaintenanceFacet();
        RugLaunderingFacet newLaunderingFacet = new RugLaunderingFacet();
        RugCommerceFacet newCommerceFacet = new RugCommerceFacet();

        console.log("   Deployed updated facets");

        // Prepare facet cuts - only add the new diamond frame functions
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](2);

        // Add RugAgingFacet with only new diamond frame functions
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(newAgingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getNewDiamondFrameFunctions()
        });

        // Add RugCommerceFacet with only new pool functions
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(newCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getNewPoolFunctions()
        });

        // Execute the upgrade (call diamondCut on the diamond directly, as it delegates to its cut facet)
        IDiamondCut(EXISTING_DIAMOND).diamondCut(cuts, address(0), "");

        console.log("   Successfully upgraded all facets with diamond frame functionality");
    }

    function configurePool() internal {
        console.log("3. Configuring Diamond Frame Pool...");

        // Set pool contract address in the diamond
        RugCommerceFacet(EXISTING_DIAMOND).setPoolContract(poolAddr);
        console.log("   Set pool contract address");

        // Set pool percentage (1% of royalties)
        RugCommerceFacet(EXISTING_DIAMOND).setPoolPercentage(POOL_PERCENTAGE);
        console.log("   Set pool percentage to 1% (100 basis points)");

        // Verify configuration
        (address configuredPoolContract, uint256 configuredPoolPercentage) = RugCommerceFacet(EXISTING_DIAMOND).getPoolConfig();
        require(configuredPoolContract == poolAddr, "Pool contract not set correctly");
        require(configuredPoolPercentage == POOL_PERCENTAGE, "Pool percentage not set correctly");

        console.log("   Configuration verified successfully");
    }

    // Updated selector functions to include new diamond frame functions

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](13);
        selectors[0] = RugAgingFacet.getDirtLevel.selector;
        selectors[1] = RugAgingFacet.getAgingLevel.selector;
        selectors[2] = RugAgingFacet.getFrameLevel.selector;
        selectors[3] = RugAgingFacet.getFrameName.selector;
        selectors[4] = RugAgingFacet.getMaintenanceScore.selector;
        selectors[5] = RugAgingFacet.hasDirt.selector;
        selectors[6] = RugAgingFacet.isCleaningFree.selector;
        selectors[7] = RugAgingFacet.timeUntilNextAging.selector;
        selectors[8] = RugAgingFacet.timeUntilNextDirt.selector;
        selectors[9] = RugAgingFacet.getAgingState.selector;
        // New diamond frame functions
        selectors[10] = RugAgingFacet.getDiamondFrameCount.selector;
        selectors[11] = RugAgingFacet.hasDiamondFrame.selector;
        selectors[12] = RugAgingFacet.getDiamondFrameTokenIds.selector;
        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](19);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[8] = RugMaintenanceFacet.needsMasterRestoration.selector;
        selectors[9] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[10] = RugMaintenanceFacet.getMaintenanceHistory.selector;
        // Agent authorization + agent entrypoints
        selectors[11] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[12] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[13] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[14] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[15] = RugMaintenanceFacet.masterRestoreRugAgent.selector;
        // Agent management functions
        selectors[16] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        selectors[17] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;
        selectors[18] = RugMaintenanceFacet.isAgentAuthorized.selector;
        return selectors;
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        selectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        selectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        selectors[4] = RugLaunderingFacet.getLaunderingSaleHistory.selector;
        selectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        selectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingStats.selector;
        return selectors;
    }

    function _getNewDiamondFrameFunctions() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        // New diamond frame query functions
        selectors[0] = RugAgingFacet.getDiamondFrameCount.selector;
        selectors[1] = RugAgingFacet.hasDiamondFrame.selector;
        selectors[2] = RugAgingFacet.getDiamondFrameTokenIds.selector;
        return selectors;
    }

    function _getNewPoolFunctions() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        // Diamond Frame Pool integration selectors
        selectors[0] = RugCommerceFacet.setPoolContract.selector;
        selectors[1] = RugCommerceFacet.setPoolPercentage.selector;
        selectors[2] = RugCommerceFacet.claimPoolRoyalties.selector;
        selectors[3] = RugCommerceFacet.getPoolConfig.selector;
        selectors[4] = RugCommerceFacet.emergencyWithdrawFromPool.selector;
        return selectors;
    }
}
