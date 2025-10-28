// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract CallInitMetadata is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Calling initializeERC721Metadata...");

        // Call the function directly using low-level call
        (bool success, bytes memory data) = diamondAddr.call(
            abi.encodeWithSignature("initializeERC721Metadata()")
        );

        if (success) {
            console.log("ERC721 metadata initialized successfully");
        } else {
            console.log("Failed to initialize metadata");
            console.logBytes(data);
        }

        vm.stopBroadcast();
    }
}
