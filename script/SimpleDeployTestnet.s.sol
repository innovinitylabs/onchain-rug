// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

contract SimpleDeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying OnchainRugs to Shape L2 Testnet...");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");

        vm.startBroadcast(deployerPrivateKey);
        OnchainRugs rugs = new OnchainRugs();
        vm.stopBroadcast();

        console.log("Deployed to:", address(rugs));
        console.log("Name:", rugs.name());
        console.log("Symbol:", rugs.symbol());
        console.log("Max Supply:", rugs.maxSupply());
    }
}
