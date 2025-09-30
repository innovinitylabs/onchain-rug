// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title Add Deployer to Exception List
 * @dev Adds the deployer wallet to the exception list to bypass wallet limits
 */
contract AddDeployerToExceptions is Script {
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Adding Deployer to Exception List");
        console.log("=========================================");
        console.log("Deployer address:", deployer);
        console.log("Diamond address:", DIAMOND_ADDR);

        // Add deployer to exception list
        RugAdminFacet(DIAMOND_ADDR).addToExceptionList(deployer);
        console.log("Deployer added to exception list - bypasses wallet limits");

        console.log("=========================================");
        console.log("Deployer Exception Added Successfully!");
        console.log("Deployer can now mint unlimited rugs");
        console.log("=========================================");

        vm.stopBroadcast();
    }
}
