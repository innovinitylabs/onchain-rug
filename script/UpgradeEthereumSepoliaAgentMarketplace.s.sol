// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title Ethereum Sepolia Agent & Marketplace Upgrade
 * @dev Upgrades Ethereum Sepolia with agent management and marketplace features
 * @notice Adds agent management and marketplace offer functionality
 */
contract UpgradeEthereumSepoliaAgentMarketplace is Script {
    address public diamondAddr;

    // New facet instances
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugMarketplaceFacet public rugMarketplaceFacet;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT");
        console.log("Upgrading Ethereum Sepolia with agent & marketplace features at:", diamondAddr);

        console.log("1. Deploying updated facets...");

        // Deploy updated facets with agent and marketplace features
        rugMaintenanceFacet = new RugMaintenanceFacet();
        console.log("   RugMaintenanceFacet deployed at:", address(rugMaintenanceFacet));

        rugMarketplaceFacet = new RugMarketplaceFacet();
        console.log("   RugMarketplaceFacet deployed at:", address(rugMarketplaceFacet));

        console.log("2. Upgrading with agent management and marketplace features...");

        // Upgrade RugMaintenanceFacet with agent management functions
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getAgentManagementSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");
        console.log("   Added agent management features");

        // Add marketplace offer functions
        IDiamondCut.FacetCut[] memory marketplaceAddCut = new IDiamondCut.FacetCut[](1);
        marketplaceAddCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMarketplaceOfferSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(marketplaceAddCut, address(0), "");
        console.log("   Added marketplace offer functions");

        console.log("3. Agent & Marketplace upgrade complete!");
        console.log("   Agent Management: authorizeMaintenanceAgent, getAuthorizedAgents, isAgentAuthorized");
        console.log("   Marketplace Offers: makeOffer, acceptOffer, cancelOffer, getOffer, getTokenOffers");

        vm.stopBroadcast();
    }

    // Agent management function selectors
    function _getAgentManagementSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector; // 0x03b0b5cc
        selectors[1] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;   // 0x4f44b188
        selectors[2] = RugMaintenanceFacet.getAuthorizedAgents.selector;     // 0xd8638e56
        selectors[3] = RugMaintenanceFacet.isAgentAuthorized.selector;       // 0xb326b99a
        return selectors;
    }

    // Marketplace offer function selectors
    function _getMarketplaceOfferSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = RugMarketplaceFacet.makeOffer.selector;           // 0xb03053b6
        selectors[1] = RugMarketplaceFacet.acceptOffer.selector;         // 0x305a67a8
        selectors[2] = RugMarketplaceFacet.cancelOffer.selector;         // 0xc4604943
        selectors[3] = RugMarketplaceFacet.getOffer.selector;            // 0x4884f459
        selectors[4] = RugMarketplaceFacet.getTokenOffers.selector;      // 0x9407ea98
        selectors[5] = RugMarketplaceFacet.getActiveTokenOffers.selector; // 0x164e68de
        return selectors;
    }
}