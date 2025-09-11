// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

contract WithdrawScript is Script {
    function run() external {
        // Get contract address from environment or use the deployed address
        address contractAddress = vm.envAddress("ONCHAIN_RUGS_CONTRACT");
        
        // Get private key from environment
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(privateKey);
        
        // Create contract instance
        OnchainRugs rugContract = OnchainRugs(contractAddress);
        
        // Check current balance
        uint256 balance = address(rugContract).balance;
        console.log("Contract balance:", balance);
        console.log("Contract balance in ETH:", balance / 1e18);
        
        // Withdraw funds
        rugContract.withdraw();
        
        console.log("Withdrawal completed!");
        
        vm.stopBroadcast();
    }
}
