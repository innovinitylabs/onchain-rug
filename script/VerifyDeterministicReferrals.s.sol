// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

/**
 * @title VerifyDeterministicReferrals
 * @notice Verify that the deterministic referral system is working on Base Sepolia
 */
contract VerifyDeterministicReferrals is Script {
    address constant DIAMOND = 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff;

    function run() external view {
        console.log("Verifying deterministic referral system on Base Sepolia");
        console.log("Diamond address:", DIAMOND);

        // Try to call generateShortCode function
        (bool success, bytes memory data) = DIAMOND.staticcall(
            abi.encodeWithSignature("generateShortCode(address)", 0x1234567890AbcdEF1234567890aBcdef12345678)
        );

        if (success) {
            string memory code = abi.decode(data, (string));
            console.log("generateShortCode works! Result:", code);
        } else {
            console.log("generateShortCode failed");
        }

        // Try to call isRegistered function
        (success, data) = DIAMOND.staticcall(
            abi.encodeWithSignature("isRegistered(address)", 0x1234567890AbcdEF1234567890aBcdef12345678)
        );

        if (success) {
            bool registered = abi.decode(data, (bool));
            console.log("isRegistered works! Result:", registered);
        } else {
            console.log("isRegistered failed");
        }

        console.log("Verification complete!");
    }
}