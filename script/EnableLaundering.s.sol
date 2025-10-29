// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugAdminFacet.sol";

/**
 * @title EnableLaundering
 * @notice Enables laundering functionality on Base Sepolia or Shape Sepolia networks
 * @dev This script calls setLaunderingEnabled(true) on the RugAdminFacet
 * @dev Run with --sig "run(uint256)" flag and network parameter (84532 for Base, 11011 for Shape)
 */
contract EnableLaundering is Script {

    // Network constants
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;
    uint256 constant SHAPE_SEPOLIA_CHAIN_ID = 11011;

    // Contract addresses
    address constant BASE_SEPOLIA_CONTRACT = 0xa43532205Fc90b286Da98389a9883347Cc4064a8;
    address constant SHAPE_SEPOLIA_CONTRACT = 0x5419436b1e97063B636c70ba2E829Ed26336aA0d;

    function run() external {
        // Default to Base Sepolia if no network specified
        run(BASE_SEPOLIA_CHAIN_ID);
    }

    function run(uint256 chainId) public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");

        address targetContract;
        string memory networkName;

        if (chainId == BASE_SEPOLIA_CHAIN_ID) {
            targetContract = BASE_SEPOLIA_CONTRACT;
            networkName = "Base Sepolia";
        } else if (chainId == SHAPE_SEPOLIA_CHAIN_ID) {
            targetContract = SHAPE_SEPOLIA_CONTRACT;
            networkName = "Shape Sepolia";
        } else {
            revert("Unsupported chain ID. Use 84532 for Base Sepolia or 11011 for Shape Sepolia");
        }

        console.log("Enabling laundering on", networkName);
        console.log("Contract address:", targetContract);
        console.log("Chain ID:", chainId);

        vm.startBroadcast(deployerPrivateKey);

        // Enable laundering
        console.log("Calling setLaunderingEnabled(true)...");
        RugAdminFacet(targetContract).setLaunderingEnabled(true);

        console.log("Laundering successfully enabled on", networkName, "!");

        vm.stopBroadcast();
    }
}
