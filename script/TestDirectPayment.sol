// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugMaintenanceFacet.sol";

contract TestDirectPayment is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new facet
        RugMaintenanceFacet facet = new RugMaintenanceFacet();
        
        console.log("Test: RugMaintenanceFacet deployed at:", address(facet));
        console.log("Test: Diamond address:", diamondAddr);
        console.log("Test: Deployer:", vm.addr(deployerPrivateKey));
        
        vm.stopBroadcast();
    }
}
