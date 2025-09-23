// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title Update HTML Generator Script
 * @dev Updates the OnchainRugsHTMLGenerator contract with fixes
 */
contract UpdateHTMLGenerator is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Updating OnchainRugsHTMLGenerator...");

        // Deploy new HTML generator
        OnchainRugsHTMLGenerator newGenerator = new OnchainRugsHTMLGenerator();
        address newGeneratorAddr = address(newGenerator);

        console.log("New OnchainRugsHTMLGenerator deployed at:", newGeneratorAddr);

        // Get diamond address from environment or use known address
        address diamondAddr = vm.envOr("DIAMOND_ADDRESS", address(0xF6eE290597cCB1e136772122C1c4DcBb6Bf7f089));

        // Update the diamond to use the new HTML generator
        RugAdminFacet rugAdmin = RugAdminFacet(diamondAddr);
        rugAdmin.setScriptyContracts(
            address(0), // scriptyBuilder - keep existing
            address(0), // scriptyStorage - keep existing
            newGeneratorAddr // new HTML generator
        );

        console.log("Diamond updated to use new HTML generator");

        vm.stopBroadcast();

        console.log("Update complete!");
        console.log("New HTML Generator:", newGeneratorAddr);
    }
}
