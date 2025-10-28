// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";

/**
 * @title VerifyLaundering
 * @notice Verifies that laundering is enabled on both networks
 * @dev Calls getLaunderingConfig() to check if laundering is enabled
 */
contract VerifyLaundering is Script {

    // Network constants
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;
    uint256 constant SHAPE_SEPOLIA_CHAIN_ID = 11011;

    // Contract addresses
    address constant BASE_SEPOLIA_CONTRACT = 0xa43532205Fc90b286Da98389a9883347Cc4064a8;
    address constant SHAPE_SEPOLIA_CONTRACT = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325;

    function run() external view {
        // Try to determine which network we're on by checking which contract exists
        if (addressExists(BASE_SEPOLIA_CONTRACT)) {
            console.log("Connected to Base Sepolia network");
            verifyNetwork(BASE_SEPOLIA_CONTRACT, "Base Sepolia");
        } else if (addressExists(SHAPE_SEPOLIA_CONTRACT)) {
            console.log("Connected to Shape Sepolia network");
            verifyNetwork(SHAPE_SEPOLIA_CONTRACT, "Shape Sepolia");
        } else {
            console.log("Could not determine network - checking both contracts anyway");
            verifyNetwork(BASE_SEPOLIA_CONTRACT, "Base Sepolia");
            verifyNetwork(SHAPE_SEPOLIA_CONTRACT, "Shape Sepolia");
        }
    }

    function addressExists(address addr) internal view returns (bool) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(addr)
        }
        return codeSize > 0;
    }

    function verifyNetwork(address contractAddr, string memory networkName) internal view {
        console.log("Checking", networkName, "at", contractAddr);

        try RugLaunderingFacet(contractAddr).getLaunderingConfig() returns (uint256 threshold, bool enabled) {
            console.log("  Laundering enabled:", enabled ? "YES" : "NO");
            console.log("  Laundering threshold:", threshold, "wei");

            if (enabled) {
                console.log("  [SUCCESS] Laundering is properly enabled on", networkName);
            } else {
                console.log("  [ERROR] Laundering is NOT enabled on", networkName);
            }
        } catch Error(string memory reason) {
            console.log("  [ERROR] Error calling getLaunderingConfig():", reason);
        } catch {
            console.log("  [ERROR] Unknown error calling getLaunderingConfig()");
        }

        console.log(""); // Empty line for readability
    }
}
