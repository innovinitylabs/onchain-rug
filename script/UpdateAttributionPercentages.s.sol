// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";

contract UpdateAttributionPercentages is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Updating attribution percentages at:", diamondAddr);

        // Update attribution percentages to 2.5% (250 basis points)
        // Note: Using the old function name since that's what's deployed
        (bool success,) = diamondAddr.call(abi.encodeWithSignature("setReferralPercentages(uint256,uint256)", 250, 250));
        require(success, "Failed to update attribution percentages");

        console.log("Attribution percentages updated to 2.5% (250 basis points)");

        vm.stopBroadcast();
    }
}