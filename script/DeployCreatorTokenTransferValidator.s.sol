// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import {CreatorTokenTransferValidator} from "@limitbreak/creator-token-contracts/utils/CreatorTokenTransferValidator.sol";

/**
 * @title DeployCreatorTokenTransferValidator
 * @notice Deployment script for CreatorTokenTransferValidator on Shape L2
 * @dev Deploys the transfer validator contract that ERC-721-C collections use for security policies
 */
contract DeployCreatorTokenTransferValidator is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=========================================");
        console.log("Deploying CreatorTokenTransferValidator to Shape L2");
        console.log("=========================================");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the transfer validator
        CreatorTokenTransferValidator transferValidator = new CreatorTokenTransferValidator(deployer);

        console.log("CreatorTokenTransferValidator deployed at:", address(transferValidator));

        // The constructor automatically sets up default security policies:
        // - Level 0: No restrictions
        // - Level 1: Operator whitelist with OTC enabled
        // - Level 2: Operator whitelist with OTC disabled
        // - Level 3: Operator whitelist + no contract receivers
        // - Level 4: Operator whitelist + EOA only receivers
        // - Level 5: Strict whitelist + no contracts
        // - Level 6: Strict whitelist + EOA only

        // Create a default operator whitelist for Shape ecosystem
        uint120 defaultWhitelistId = transferValidator.createOperatorWhitelist("Shape Ecosystem Marketplaces");

        console.log("Created default operator whitelist with ID:", defaultWhitelistId);

        vm.stopBroadcast();

        console.log("\n=========================================");
        console.log("Deployment Summary");
        console.log("=========================================");
        console.log("CreatorTokenTransferValidator:", address(transferValidator));
        console.log("Default Whitelist ID:", defaultWhitelistId);
        console.log("Owner:", deployer);
        console.log("\nNext Steps:");
        console.log("1. Add approved marketplaces to whitelist:", defaultWhitelistId);
        console.log("2. Configure your NFT collection to use security level 1");
        console.log("3. Set the operator whitelist for your collection");
        console.log("4. Deploy Payment Processor (if not already deployed)");
        console.log("5. Update your deployment script with these addresses");
        console.log("\nExample marketplace additions:");
        console.log("- Add OpenSea (if available on Shape)");
        console.log("- Add Blur (if available on Shape)");
        console.log("- Add your custom marketplace");
        console.log("=========================================");
    }

    /**
     * @notice Add initial marketplaces to the default whitelist
     * @param validatorAddress Address of the deployed validator
     * @param whitelistId The whitelist ID to add marketplaces to
     */
    function addInitialMarketplaces(address validatorAddress, uint120 whitelistId) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        CreatorTokenTransferValidator validator = CreatorTokenTransferValidator(validatorAddress);

        // Add common marketplace addresses (these are placeholder addresses)
        // You'll need to replace with actual Shape L2 marketplace addresses

        // Example: Add a marketplace (replace with real address)
        // validator.addOperatorToWhitelist(whitelistId, 0x1234567890123456789012345678901234567890);

        console.log("Added initial marketplaces to whitelist:", whitelistId);

        vm.stopBroadcast();
    }

    /**
     * @notice Create a custom whitelist for specific collection types
     * @param validatorAddress Address of the deployed validator
     * @param whitelistName Name for the new whitelist
     */
    function createCustomWhitelist(address validatorAddress, string memory whitelistName) external returns (uint120) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        CreatorTokenTransferValidator validator = CreatorTokenTransferValidator(validatorAddress);

        uint120 whitelistId = validator.createOperatorWhitelist(whitelistName);

        console.log("Created custom whitelist:", whitelistName, "with ID:", whitelistId);

        vm.stopBroadcast();

        return whitelistId;
    }
}

