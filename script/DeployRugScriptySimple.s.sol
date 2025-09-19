// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/OnchainRugs.sol";

/**
 * @title DeployRugScriptySimple
 * @dev Simple deployment script with explicit gas limits
 */
contract DeployRugScriptySimple is Script {
    // Shape L2 Testnet EthFS FileStore
    address constant ETHFS_FILESTORE = 0xFe1411d6864592549AdE050215482e4385dFa0FB;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== SIMPLE RUG SCRIPPY DEPLOYMENT ===");
        console.log("Network: Shape L2 Testnet");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");

        // Check balance
        require(deployer.balance > 0.01 ether, "Insufficient balance for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ScriptyBuilderV2 first
        console.log("\n1. Deploying ScriptyBuilderV2...");
        ScriptyBuilderV2 scriptyBuilder = new ScriptyBuilderV2();
        console.log("ScriptyBuilderV2 deployed at:", address(scriptyBuilder));

        // Deploy ScriptyStorageV2
        console.log("\n2. Deploying ScriptyStorageV2...");
        ScriptyStorageV2 scriptyStorage = new ScriptyStorageV2(IFileStore(ETHFS_FILESTORE));
        console.log("ScriptyStorageV2 deployed at:", address(scriptyStorage));

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
            address(scriptyStorage),
            address(htmlGenerator)
        );
        console.log("Contract relationships established!");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("ScriptyBuilderV2:", address(scriptyBuilder));
        console.log("ScriptyStorageV2:", address(scriptyStorage));
        console.log("OnchainRugsHTMLGenerator:", address(htmlGenerator));
        console.log("OnchainRugs:", address(onchainRugs));
        console.log("EthFS FileStore:", ETHFS_FILESTORE);

        // Verify deployments
        console.log("\n=== VERIFICATION ===");
        console.log("Checking contract code sizes...");

        // Check if contracts have code
        uint256 builderSize = address(scriptyBuilder).code.length;
        uint256 storageSize = address(scriptyStorage).code.length;
        uint256 htmlSize = address(htmlGenerator).code.length;
        uint256 rugsSize = address(onchainRugs).code.length;

        console.log("ScriptyBuilderV2 code size:", builderSize);
        console.log("ScriptyStorageV2 code size:", storageSize);
        console.log("OnchainRugsHTMLGenerator code size:", htmlSize);
        console.log("OnchainRugs code size:", rugsSize);

        require(builderSize > 0, "ScriptyBuilderV2 deployment failed");
        require(storageSize > 0, "ScriptyStorageV2 deployment failed");
        require(htmlSize > 0, "HTMLGenerator deployment failed");
        require(rugsSize > 0, "OnchainRugs deployment failed");

        console.log("All contracts deployed successfully!");
    }
}
