// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract SimpleDiamondCut is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        // New facet address
        address newFacet = 0xeBfD53cD9781E1F2D0cB7EFd7cBE6Dc7878836C8;

        // Create facet cut with hardcoded selectors for direct payment functions
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = 0x4e9f1c5e; // cleanRugAgent
        selectors[1] = 0x4e9f1c5d; // restoreRugAgent
        selectors[2] = 0x4e9f1c5c; // masterRestoreRugAgent

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: newFacet,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");

        vm.stopBroadcast();
    }
}
