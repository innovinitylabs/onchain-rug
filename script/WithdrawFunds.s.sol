// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";

/**
 * @title WithdrawFunds
 * @notice Script to withdraw all accumulated ETH from the OnchainRugs diamond contract
 * @dev Calls the withdrawTo function from RugCommerceFacet to withdraw all funds to a specified address
 */
contract WithdrawFunds is Script {
    // OnchainRugs Diamond contract address (Shape Sepolia testnet)
    address constant DIAMOND_ADDRESS = 0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459;

    // Target wallet address for withdrawal
    address constant WITHDRAWAL_ADDRESS = 0xEB6B81B6ccBd5A330E99c19333C3dE560f5ECc94;

    function run() external {
        vm.startBroadcast();

        // Get current balance
        uint256 balance = DIAMOND_ADDRESS.balance;
        console.log("Contract balance before withdrawal:", balance);

        if (balance == 0) {
            console.log("No funds to withdraw");
            vm.stopBroadcast();
            return;
        }

        // Call withdrawTo function with amount = 0 (withdraw all)
        (bool success,) = DIAMOND_ADDRESS.call(
            abi.encodeWithSignature("withdrawTo(address,uint256)", WITHDRAWAL_ADDRESS, 0)
        );

        require(success, "Withdrawal failed");

        // Check balance after withdrawal
        uint256 newBalance = DIAMOND_ADDRESS.balance;
        console.log("Contract balance after withdrawal:", newBalance);
        console.log("Withdrawn amount:", balance - newBalance);
        console.log("Funds sent to:", WITHDRAWAL_ADDRESS);

        vm.stopBroadcast();
    }
}
