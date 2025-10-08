// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract UpdateHTMLGeneratorFacet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address diamondAddr = 0xBd5b888860C857FE82B3442A31A43608b29e8D1f;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy updated OnchainRugsHTMLGenerator
        OnchainRugsHTMLGenerator htmlGenerator = new OnchainRugsHTMLGenerator();
        address htmlGeneratorAddr = address(htmlGenerator);

        console.log("Deploying updated OnchainRugsHTMLGenerator...");
        console.log("New HTML generator deployed at:", htmlGeneratorAddr);

        // Update the HTML generator address using the admin facet
        // Current addresses from deployment
        address currentBuilder = 0xeB7Ef4a24a6972dDb3CaFBA3e0E899935eE3ccF6;
        address currentStorage = 0xB40F968c837C3097ba498B0dA70ec1A509a441Be;

        // Update with the new HTML generator
        RugAdminFacet(diamondAddr).setScriptyContracts(currentBuilder, currentStorage, htmlGeneratorAddr);

        vm.stopBroadcast();

        console.log("HTML generator updated successfully");
    }
}
