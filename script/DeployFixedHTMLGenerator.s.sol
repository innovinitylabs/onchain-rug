// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugsHTMLGenerator.sol";

contract DeployFixedHTMLGenerator is Script {
    OnchainRugsHTMLGenerator public htmlGenerator;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying FIXED HTML Generator...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        // Deploy the HTML generator with the fixed inline script code
        htmlGenerator = new OnchainRugsHTMLGenerator();
        address newGeneratorAddr = address(htmlGenerator);

        console.log("New HTML Generator deployed at:", newGeneratorAddr);

        vm.stopBroadcast();

        console.log("\\nUPDATE YOUR ONCHAIN RUGS CONTRACT:");
        console.log("Call setRugScriptyContracts() with the new HTML generator address:");
        console.log("New HTML Generator:", newGeneratorAddr);
        console.log("\\nUse your existing addresses for the other parameters:");
        console.log("Builder: 0x48a988dC026490c11179D9Eb7f7aBC377CaFA353");
        console.log("Storage: 0x2263cf7764c19070b6fce6e8b707f2bdc35222c9");
    }
}
