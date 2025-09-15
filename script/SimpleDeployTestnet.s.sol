// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/OnchainRugs.sol";

contract SimpleDeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying OnchainRugs (Upgradeable) to Shape L2 Testnet...");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy implementation contract
        OnchainRugs implementation = new OnchainRugs();

        // Encode initialization call
        bytes memory initData = abi.encodeWithSelector(
            OnchainRugs.initialize.selector
        );

        // Deploy UUPS proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        vm.stopBroadcast();

        // Cast proxy to OnchainRugs for testing
        OnchainRugs rugs = OnchainRugs(address(proxy));

        console.log("Implementation deployed at:", address(implementation));
        console.log("Proxy deployed at:", address(proxy));
        console.log("Use proxy address for interactions:", address(proxy));
        console.log("");
        console.log("Contract Details:");
        console.log("- Name:", rugs.name());
        console.log("- Symbol:", rugs.symbol());
        console.log("- Max Supply:", rugs.maxSupply());
        console.log("- Owner:", rugs.owner());
    }
}
