// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title Update RugAdminFacet
 * @dev Adds exception list management functions to RugAdminFacet
 */
contract UpdateRugAdminFacet is Script {
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Updating RugAdminFacet with Exception List Functions");
        console.log("=========================================");

        // Get the current RugAdminFacet address
        bytes4 facetAddressSelector = bytes4(keccak256("facetAddress(bytes4)"));
        (bool success, bytes memory data) = DIAMOND_ADDR.call(abi.encodeWithSelector(facetAddressSelector, bytes4(0x4f7fbdde))); // updateWalletLimit selector
        require(success, "Failed to get facet address");

        address rugAdminFacetAddr = abi.decode(data, (address));
        console.log("RugAdminFacet address:", rugAdminFacetAddr);

        // Add exception list selectors to existing RugAdminFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: rugAdminFacetAddr,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getExceptionSelectors()
        });

        IDiamondCut(DIAMOND_ADDR).diamondCut(cut, address(0), "");
        console.log("Added exception list functions to RugAdminFacet");

        console.log("=========================================");
        console.log("RugAdminFacet Updated Successfully!");
        console.log("Now includes exception list management");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getExceptionSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = RugAdminFacet.addToExceptionList.selector;
        selectors[1] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[2] = RugAdminFacet.getExceptionList.selector;
        return selectors;
    }
}
