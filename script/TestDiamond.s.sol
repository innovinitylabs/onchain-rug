// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/facets/DiamondLoupeFacet.sol";

contract TestDiamond is Script {
    address constant DIAMOND = 0x0627da3FF590E92Ca249cE600548c25cf6eFEb1f;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy DiamondLoupeFacet
        DiamondLoupeFacet loupeFacet = new DiamondLoupeFacet();
        address loupeAddress = address(loupeFacet);
        console.log("Deployed DiamondLoupeFacet at:", loupeAddress);

        // Add DiamondLoupeFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = DiamondLoupeFacet.facets.selector;
        selectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        selectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        selectors[3] = DiamondLoupeFacet.facetAddress.selector;
        selectors[4] = DiamondLoupeFacet.supportsInterface.selector;

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: loupeAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        IDiamondCut(DIAMOND).diamondCut(cut, address(0), "");
        console.log("Added DiamondLoupeFacet to Diamond");

        vm.stopBroadcast();
    }
}
