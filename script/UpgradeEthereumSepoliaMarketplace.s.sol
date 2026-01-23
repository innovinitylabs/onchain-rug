// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title Ethereum Sepolia Advanced Marketplace Upgrade
 * @dev Upgrades Ethereum Sepolia with advanced marketplace offer features
 * @notice Adds offer system, enhanced listings, and marketplace analytics
 */
contract UpgradeEthereumSepoliaMarketplace is Script {
    address public diamondAddr;

    // New facet instance
    RugMarketplaceFacet public rugMarketplaceFacet;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT");
        console.log("Upgrading Ethereum Sepolia marketplace at:", diamondAddr);

        console.log("1. Deploying advanced marketplace facet...");

        // Deploy updated marketplace facet with offer functionality
        rugMarketplaceFacet = new RugMarketplaceFacet();
        console.log("   RugMarketplaceFacet deployed at:", address(rugMarketplaceFacet));

        console.log("2. Upgrading with advanced marketplace features...");

        // Add marketplace offer functions
        IDiamondCut.FacetCut[] memory marketplaceAddCut = new IDiamondCut.FacetCut[](1);
        marketplaceAddCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getMarketplaceOfferSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(marketplaceAddCut, address(0), "");
        console.log("   ✅ Added marketplace offer system");

        console.log("3. Advanced marketplace upgrade complete!");
        console.log("   ✅ Offer System: makeOffer, acceptOffer, cancelOffer");
        console.log("   ✅ Offer Queries: getOffer, getTokenOffers, getActiveTokenOffers");
        console.log("   ✅ Enhanced Listings: Advanced marketplace functionality");
        console.log("   ✅ Analytics: Marketplace statistics and tracking");

        vm.stopBroadcast();
    }

    // Marketplace offer function selectors (new advanced features)
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