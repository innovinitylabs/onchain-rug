// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract SetERC721Metadata is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Setting ERC721 metadata...");

        // Call the function directly using low-level call
        (bool success, bytes memory data) = diamondAddr.call(
            abi.encodeWithSignature("setERC721Metadata(string,string)", "OnchainRugs", "RUGS")
        );

        if (success) {
            console.log("ERC721 metadata set successfully");
        } else {
            console.log("Failed to set metadata");
            console.logBytes(data);
        }

        vm.stopBroadcast();
    }
}
