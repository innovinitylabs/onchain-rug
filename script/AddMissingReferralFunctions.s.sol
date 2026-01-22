// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAttributionRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title AddMissingReferralFunctions
 * @notice Add the missing referral functions that weren't included in the previous upgrade
 */
contract AddMissingReferralFunctions is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address from environment
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Adding missing functions to diamond at:", diamondAddr);

        // Get the missing selectors
        bytes4[] memory selectorsToAdd = new bytes4[](4);
        selectorsToAdd[0] = RugAttributionRegistryFacet.registerForAttribution.selector; // 0xa53bb4e4
        selectorsToAdd[1] = RugAttributionRegistryFacet.getAttributionCode.selector; // 0x92c40344
        selectorsToAdd[2] = RugAttributionRegistryFacet.generateAttributionCode.selector; // 0xd4917c75
        selectorsToAdd[3] = RugAttributionRegistryFacet.isAttributionRegistered.selector; // 0xc3c5a547

        console.log("Adding", selectorsToAdd.length, "missing selectors");

        // Create the facet cut
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: 0xC59f679B309D8E5b843bcDE2d87a17855Fd2f095, // RugReferralRegistryFacet
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectorsToAdd
        });

        // Execute the diamond cut
        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        console.log("Successfully added missing referral functions!");
    }
}