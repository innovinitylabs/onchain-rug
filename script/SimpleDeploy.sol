// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/RugMarketplace.sol";

contract SimpleDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // For now, just deploy marketplace with a dummy address
        // We'll update it later
        RugMarketplace marketplace = new RugMarketplace(address(1));

        vm.stopBroadcast();

        console.log("Marketplace deployed at:", address(marketplace));
    }
}
