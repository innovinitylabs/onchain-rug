// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "lib/openzeppelin-contracts/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "lib/openzeppelin-contracts/contracts/proxy/transparent/ProxyAdmin.sol";
import "../src/OnchainRugs.sol";

contract DeployUpgradeable is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation contract
        OnchainRugs implementation = new OnchainRugs();

        // Encode initialization call
        bytes memory initData = abi.encodeWithSelector(
            OnchainRugs.initialize.selector
        );

        // Deploy proxy admin
        ProxyAdmin proxyAdmin = new ProxyAdmin(msg.sender);

        // Deploy transparent proxy
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            address(implementation),
            address(proxyAdmin),
            initData
        );

        vm.stopBroadcast();

        console.log("Implementation deployed at:", address(implementation));
        console.log("Proxy Admin deployed at:", address(proxyAdmin));
        console.log("Proxy deployed at:", address(proxy));
        console.log("Use proxy address for interactions:", address(proxy));
    }
}
