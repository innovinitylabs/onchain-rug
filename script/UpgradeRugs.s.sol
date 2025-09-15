// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/OnchainRugs.sol";

contract UpgradeRugs is Script {
    function run(address proxyAddress) external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementation
        OnchainRugs newImplementation = new OnchainRugs();

        // For UUPS, we call upgradeTo on the proxy directly
        // The proxy will delegate the call to the implementation
        ERC1967Proxy proxy = ERC1967Proxy(payable(proxyAddress));
        OnchainRugs proxyAsContract = OnchainRugs(proxyAddress);

        // Call upgradeTo on the proxy (it will delegate to implementation)
        proxyAsContract.upgradeTo(address(newImplementation));

        vm.stopBroadcast();

        console.log("New implementation deployed at:", address(newImplementation));
        console.log("Proxy upgraded successfully");
    }
}
