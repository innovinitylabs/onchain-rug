// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/RugMarketplace.sol";

contract DeployMarketplace is Script {
    function run(address rugsContractAddress) external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy marketplace contract with rugs contract address
        RugMarketplace marketplace = new RugMarketplace(rugsContractAddress);

        vm.stopBroadcast();

        console.log("Marketplace deployed at:", address(marketplace));
        console.log("Connected to rugs contract:", rugsContractAddress);
    }
}
