// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugAttributionRegistryFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract FixAttributionMapping is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Fixing attribution mapping at:", diamondAddr);

        // Fix the broken mapping
        RugAttributionRegistryFacet attributionFacet = RugAttributionRegistryFacet(diamondAddr);
        attributionFacet.fixAttributionMapping("nVQEAJ1Ma", 0x14fb5d894d7E62F3E69Ea985273e9eE31e8fe72C);

        console.log("Fixed attribution mapping for referrer and code");

        vm.stopBroadcast();
    }
}