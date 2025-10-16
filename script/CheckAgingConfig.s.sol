// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

/**
 * @title CheckAgingConfig
 * @notice Check the current aging configuration values
 */
contract CheckAgingConfig is Script {
    address constant DIAMOND = 0x2aB6ad4761307CFaF229c75F6B4A909B73175146;

    function run() public view {
        console.log("=== CHECKING AGING CONFIGURATION ===");
        console.log("Diamond address:", DIAMOND);
        console.log("");

        // Try to call RugAdminFacet functions to check aging config
        // Note: These functions might not exist, but let's try

        console.log("Checking if we can access aging configuration...");

        // Check dirt level times
        try this.getDirtLevel1Days() returns (uint256 value) {
            console.log("dirtLevel1Days:", value, "seconds");
        } catch {
            console.log("dirtLevel1Days: Not accessible");
        }

        try this.getDirtLevel2Days() returns (uint256 value) {
            console.log("dirtLevel2Days:", value, "seconds");
        } catch {
            console.log("dirtLevel2Days: Not accessible");
        }

        try this.getAgingAdvanceDays() returns (uint256 value) {
            console.log("agingAdvanceDays:", value, "seconds");
            console.log("Expected for main branch: 1209600 (14 days)");
            console.log("Set in deployment: 180 (3 minutes)");
        } catch {
            console.log("agingAdvanceDays: Not accessible");
        }
    }

    // Helper functions to call the contract
    function getDirtLevel1Days() public view returns (uint256) {
        (bool success, bytes memory data) = DIAMOND.staticcall(abi.encodeWithSignature("getDirtLevel1Days()"));
        require(success, "Call failed");
        return abi.decode(data, (uint256));
    }

    function getDirtLevel2Days() public view returns (uint256) {
        (bool success, bytes memory data) = DIAMOND.staticcall(abi.encodeWithSignature("getDirtLevel2Days()"));
        require(success, "Call failed");
        return abi.decode(data, (uint256));
    }

    function getAgingAdvanceDays() public view returns (uint256) {
        (bool success, bytes memory data) = DIAMOND.staticcall(abi.encodeWithSignature("getAgingAdvanceDays()"));
        require(success, "Call failed");
        return abi.decode(data, (uint256));
    }
}
