// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title UpdateScriptyContracts
 * @notice Update the contract to use the new HTML generator with fixed frame mapping
 */
contract UpdateScriptyContracts is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    // From deployment broadcast
    address constant SCRIPTY_BUILDER = 0x70480852Cf87585b33Ea6321623bA72e86E7E554;
    address constant SCRIPTY_STORAGE = 0x15561aBB01Ec971022df5703cf755f70072Aa0e9;
    address constant NEW_HTML_GENERATOR = 0xB63de64E01E220CD79B5E56e0FDA4B180A8CD015;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== UPDATING SCRIPTY CONTRACTS ===");
        console.log("Diamond:", DIAMOND);
        console.log("New HTML Generator:", NEW_HTML_GENERATOR);

        // Update to use the new HTML generator with fixed frame mapping
        RugAdminFacet(DIAMOND).setScriptyContracts(
            SCRIPTY_BUILDER,
            SCRIPTY_STORAGE,
            NEW_HTML_GENERATOR
        );

        console.log("Scripty contracts updated!");
        console.log("   - ScriptyBuilder:", SCRIPTY_BUILDER);
        console.log("   - ScriptyStorage:", SCRIPTY_STORAGE);
        console.log("   - HTML Generator:", NEW_HTML_GENERATOR);
        console.log("");
        console.log("Frame display issue fixed!");
        console.log("Bronze rugs will now show proper frame visuals in HTML!");

        vm.stopBroadcast();
    }
}