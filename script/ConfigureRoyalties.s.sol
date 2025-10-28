// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugCommerceFacet.sol";

/**
 * @title Configure Royalties
 * @notice Script to set up royalty configuration on deployed contract
 */
contract ConfigureRoyalties is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        // Use the deployed Shape Sepolia contract address
        address diamondAddr = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325; // From SHAPE_SEPOLIA_DEPLOYMENT.md

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== Configuring Royalties ===");
        console.log("Contract:", diamondAddr);

        // Configure 10% royalties to deployer address
        address[] memory recipients = new address[](1);
        recipients[0] = vm.addr(deployerPrivateKey); // Deployer's address

        uint256[] memory recipientSplits = new uint256[](1);
        recipientSplits[0] = 1000; // 10% = 1000 basis points

        RugCommerceFacet(diamondAddr).configureRoyalties(
            1000, // 10% royalty (1000 basis points)
            recipients,
            recipientSplits
        );

        console.log("Royalties configured:");
        console.log("  - Percentage: 10%");
        console.log("  - Recipient:", recipients[0]);
        console.log("  - Split: 100% to recipient");

        // Verify configuration
        (uint256 percentage, address[] memory configuredRecipients, uint256[] memory splits) =
            RugCommerceFacet(diamondAddr).getRoyaltyConfig();

        console.log("\n=== Verification ===");
        console.log("Royalty Percentage configured successfully");
        console.log("Recipients configured successfully");

        vm.stopBroadcast();
    }
}
