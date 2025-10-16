// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title UpdateScriptyContracts
 * @notice Update the scripty contract addresses to use the new HTML generator
 * @dev Updates RugAdminFacet to point to the new OnchainRugsHTMLGenerator
 */
contract UpdateScriptyContracts is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Current addresses (from previous deployment)
        address currentBuilder = 0xeB7Ef4a24a6972dDb3CaFBA3e0E899935eE3ccF6;
        address currentStorage = 0xB40F968c837C3097ba498B0dA70ec1A509a441Be;
        address newHTMLGenerator = 0x67950cC17cB9a0080b16A0243A4eCa1cC80861B4;

        console.log("Updating scripty contracts...");
        console.log("Builder:", currentBuilder);
        console.log("Storage:", currentStorage);
        console.log("New HTML Generator:", newHTMLGenerator);

        // Update the scripty contracts
        RugAdminFacet(DIAMOND).setScriptyContracts(currentBuilder, currentStorage, newHTMLGenerator);

        console.log("Scripty contracts updated successfully!");

        vm.stopBroadcast();
    }
}
