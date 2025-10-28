// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract TestMetadata is Script {
    function run() external {
        address diamondAddr = vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT");

        console.log("Testing metadata...");

        // Test name
        (bool success1, bytes memory data1) = diamondAddr.call(
            abi.encodeWithSignature("name()")
        );
        
        if (success1) {
            string memory name = abi.decode(data1, (string));
            console.log("Name:", name);
            console.log("Name length:", bytes(name).length);
        } else {
            console.log("Failed to get name");
        }

        // Test symbol
        (bool success2, bytes memory data2) = diamondAddr.call(
            abi.encodeWithSignature("symbol()")
        );
        
        if (success2) {
            string memory symbol = abi.decode(data2, (string));
            console.log("Symbol:", symbol);
            console.log("Symbol length:", bytes(symbol).length);
        } else {
            console.log("Failed to get symbol");
        }
    }
}
