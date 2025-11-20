// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/DiamondFramePool.sol";
import "../src/facets/RugCommerceFacet.sol";

/**
 * @title Deploy Diamond Frame Pool
 * @notice Script to deploy DiamondFramePool contract and configure it with diamond
 */
contract DeployDiamondFramePool is Script {
    function run() external {
        // Get deployer private key
        uint256 deployerPrivateKey;
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }

        // Get diamond address from environment or use default
        address diamondAddr;
        try vm.envAddress("DIAMOND_ADDRESS") returns (address addr) {
            diamondAddr = addr;
        } catch {
            // Default to Shape Sepolia deployment
            diamondAddr = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325;
        }

        // Minimum claimable amount (default: 0.001 ETH = 1000000000000000 wei)
        uint256 minimumClaimableAmount = 1000000000000000; // 0.001 ETH
        try vm.envUint("MINIMUM_CLAIMABLE_AMOUNT") returns (uint256 amount) {
            minimumClaimableAmount = amount;
        } catch {}

        // Pool percentage (default: 1% = 100 basis points)
        uint256 poolPercentage = 100; // 1%
        try vm.envUint("POOL_PERCENTAGE") returns (uint256 percentage) {
            poolPercentage = percentage;
        } catch {}

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Deploying DiamondFramePool");
        console.log("=========================================");
        console.log("Diamond Address:", diamondAddr);
        console.log("Minimum Claimable Amount:", minimumClaimableAmount, "wei");
        console.log("Pool Percentage:", poolPercentage, "basis points");
        console.log("Pool Percentage:", poolPercentage / 100, "%");
        console.log("=========================================");

        // Deploy DiamondFramePool
        DiamondFramePool pool = new DiamondFramePool(diamondAddr, minimumClaimableAmount);
        address poolAddr = address(pool);

        console.log("DiamondFramePool deployed at:", poolAddr);
        console.log("=========================================");

        // Configure pool in RugCommerceFacet
        console.log("Configuring pool in RugCommerceFacet...");
        
        RugCommerceFacet commerceFacet = RugCommerceFacet(diamondAddr);
        
        // Set pool contract address
        commerceFacet.setPoolContract(poolAddr);
        console.log("Pool contract address set:", poolAddr);
        
        // Set pool percentage
        commerceFacet.setPoolPercentage(poolPercentage);
        console.log("Pool percentage set:", poolPercentage, "basis points");

        // Verify configuration
        (address configuredPoolContract, uint256 configuredPoolPercentage) = 
            commerceFacet.getPoolConfig();
        
        console.log("=========================================");
        console.log("Configuration Verification:");
        console.log("  Pool Contract:", configuredPoolContract);
        console.log("  Pool Percentage:", configuredPoolPercentage, "basis points");
        console.log("=========================================");

        // Verify pool contract
        console.log("Pool Contract Verification:");
        console.log("  Diamond Contract:", pool.diamondContract());
        console.log("  Minimum Claimable:", pool.minimumClaimableAmount(), "wei");
        console.log("  Pool Balance:", pool.getPoolBalance(), "wei");
        console.log("  Total Diamond Frames:", pool.getTotalDiamondFrameNFTs());
        console.log("=========================================");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("DiamondFramePool Address:", poolAddr);
        console.log("Diamond Address:", diamondAddr);
        console.log("Minimum Claimable Amount:", minimumClaimableAmount, "wei");
        console.log("Pool Percentage:", poolPercentage, "basis points");
        console.log("=========================================");
    }
}

