// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SimpleScriptyStorage.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/OnchainRugs.sol";

/**
 * @title DeploySimpleSystem
 * @dev Deploy simplified system without EthFS dependency
 */
contract DeploySimpleSystem is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== DEPLOYING SIMPLE SYSTEM (NO ETHFS) ===");
        console.log("Network: Shape L2 Testnet");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Simple Storage
        console.log("\n1. Deploying SimpleScriptyStorage...");
        SimpleScriptyStorage simpleStorage = new SimpleScriptyStorage();
        console.log("SimpleScriptyStorage deployed at:", address(simpleStorage));

        // Deploy ScriptyBuilderV2
        console.log("\n2. Deploying ScriptyBuilderV2...");
        ScriptyBuilderV2 scriptyBuilder = new ScriptyBuilderV2();
        console.log("ScriptyBuilderV2 deployed at:", address(scriptyBuilder));

        // Deploy HTML Generator
        console.log("\n3. Deploying OnchainRugsHTMLGenerator...");
        OnchainRugsHTMLGenerator htmlGenerator = new OnchainRugsHTMLGenerator();
        console.log("OnchainRugsHTMLGenerator deployed at:", address(htmlGenerator));

        // Deploy Main Contract
        console.log("\n4. Deploying OnchainRugs...");
        OnchainRugs onchainRugs = new OnchainRugs();
        console.log("OnchainRugs deployed at:", address(onchainRugs));

        // Configure relationships
        console.log("\n5. Setting up contract relationships...");
        onchainRugs.setRugScriptyContracts(
            address(scriptyBuilder),
            address(simpleStorage),
            address(htmlGenerator)
        );
        console.log("Contract relationships established!");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("SimpleScriptyStorage:", address(simpleStorage));
        console.log("ScriptyBuilderV2:", address(scriptyBuilder));
        console.log("OnchainRugsHTMLGenerator:", address(htmlGenerator));
        console.log("OnchainRugs:", address(onchainRugs));

        // Verify deployments
        console.log("\n=== VERIFICATION ===");
        console.log("Simple storage code size:", address(simpleStorage).code.length);
        console.log("Builder code size:", address(scriptyBuilder).code.length);
        console.log("HTML gen code size:", address(htmlGenerator).code.length);
        console.log("Main contract code size:", address(onchainRugs).code.length);
    }
}
