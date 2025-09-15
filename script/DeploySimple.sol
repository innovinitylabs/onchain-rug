// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";
import "../src/RugMarketplace.sol";

contract DeploySimple is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the main NFT contract
        OnchainRugs rugs = new OnchainRugs();

        // Deploy marketplace connected to NFT contract
        RugMarketplace marketplace = new RugMarketplace(address(rugs));

        vm.stopBroadcast();

        console.log("NFT Contract deployed at:", address(rugs));
        console.log("Marketplace deployed at:", address(marketplace));
        console.log("Marketplace connected to:", address(rugs));
    }
}
