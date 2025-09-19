// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";

/**
 * @title FundDeployer
 * @dev Send ETH to the deployer account from another funded account
 */
contract FundDeployer is Script {
    function run() external {
        // Your main account private key (the one with ETH)
        uint256 mainPrivateKey = vm.envUint("MAIN_PRIVATE_KEY");
        address mainAccount = vm.addr(mainPrivateKey);

        // Deployer account (the one that needs funding)
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        uint256 fundAmount = 0.05 ether; // 0.05 ETH should be enough

        console.log("=== FUNDING DEPLOYER ACCOUNT ===");
        console.log("Main account:", mainAccount);
        console.log("Deployer account:", deployer);
        console.log("Funding amount:", fundAmount / 1e18, "ETH");

        vm.startBroadcast(mainPrivateKey);

        // Send ETH to deployer
        payable(deployer).transfer(fundAmount);

        vm.stopBroadcast();

        console.log("Funding complete!");
        console.log("Deployer new balance:", deployer.balance / 1e18, "ETH");
    }
}
