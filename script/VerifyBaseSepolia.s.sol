// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

/**
 * @title VerifyBaseSepolia
 * @notice Script to verify all contracts on Base Sepolia
 * @dev Run with: forge script script/VerifyBaseSepolia.s.sol --rpc-url base-sepolia
 */
contract VerifyBaseSepolia is Script {
    // Base Sepolia Chain ID
    uint256 constant CHAIN_ID = 84532;
    
    // Current Deployment Addresses (from .env - CURRENT)
    address constant DIAMOND = 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff;
    
    // Note: Infrastructure and pool addresses need to be retrieved from deployment logs
    // or by querying the Diamond contract. Update these with actual addresses.
    address constant DIAMOND_FRAME_POOL = address(0);  // Update with actual address
    address constant FILE_STORE = address(0);  // Update with actual address
    address constant SCRIPTY_STORAGE = address(0);  // Update with actual address
    address constant SCRIPTY_BUILDER = address(0);  // Update with actual address
    address constant HTML_GENERATOR = address(0);  // Update with actual address
    
    // Deployer address (needed for Diamond constructor args)
    address constant DEPLOYER = 0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F;
    
    // Note: Facet addresses are not stored in deployment files
    // We'll need to get them from the Diamond using facetAddress() calls
    // Or verify them separately if we know their addresses
    
    function run() external {
        console.log("=========================================");
        console.log("Base Sepolia Contract Verification");
        console.log("=========================================");
        console.log("Chain ID:", CHAIN_ID);
        console.log("");
        
        // Check if BASESCAN_API_KEY is set
        try vm.envString("BASESCAN_API_KEY") returns (string memory apiKey) {
            if (bytes(apiKey).length == 0) {
                console.log("WARNING: BASESCAN_API_KEY is empty!");
                console.log("Get your API key from: https://basescan.org/myapikey");
                console.log("");
            }
        } catch {
            console.log("WARNING: BASESCAN_API_KEY not set!");
            console.log("Get your API key from: https://basescan.org/myapikey");
            console.log("Add to .env: BASESCAN_API_KEY=your_key_here");
            console.log("");
        }
        
        console.log("To verify contracts, run these commands:");
        console.log("");
        
        // Verify Diamond
        console.log("1. Verify Diamond Contract:");
        console.log("forge verify-contract \\");
        console.log("  ", vm.toString(DIAMOND), "\\");
        console.log("  src/diamond/Diamond.sol:Diamond \\");
        console.log("  --chain-id", vm.toString(CHAIN_ID), "\\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,address)\"", vm.toString(DEPLOYER), "DIAMOND_CUT_FACET_ADDRESS)");
        console.log("");
        
        // Verify Infrastructure Contracts
        console.log("2. Verify FileStore:");
        console.log("forge verify-contract \\");
        console.log("  ", vm.toString(FILE_STORE), "\\");
        console.log("  src/scripty/dependencies/ethfs/FileStore.sol:FileStore \\");
        console.log("  --chain-id", vm.toString(CHAIN_ID), "\\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address)\" 0x4e59b44847b379578588920cA78FbF26c0B4956C)");
        console.log("");
        
        console.log("3. Verify ScriptyStorageV2:");
        console.log("forge verify-contract \\");
        console.log("  ", vm.toString(SCRIPTY_STORAGE), "\\");
        console.log("  src/scripty/ScriptyStorageV2.sol:ScriptyStorageV2 \\");
        console.log("  --chain-id", vm.toString(CHAIN_ID), "\\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,address)\"", vm.toString(FILE_STORE), vm.toString(DEPLOYER), ")");
        console.log("");
        
        console.log("4. Verify ScriptyBuilderV2:");
        console.log("forge verify-contract \\");
        console.log("  ", vm.toString(SCRIPTY_BUILDER), "\\");
        console.log("  src/scripty/ScriptyBuilderV2.sol:ScriptyBuilderV2 \\");
        console.log("  --chain-id", vm.toString(CHAIN_ID), "\\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api");
        console.log("");
        
        console.log("5. Verify OnchainRugsHTMLGenerator:");
        console.log("forge verify-contract \\");
        console.log("  ", vm.toString(HTML_GENERATOR), "\\");
        console.log("  src/OnchainRugsHTMLGenerator.sol:OnchainRugsHTMLGenerator \\");
        console.log("  --chain-id", vm.toString(CHAIN_ID), "\\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api");
        console.log("");
        
        console.log("6. Verify DiamondFramePool:");
        console.log("forge verify-contract \\");
        console.log("  ", vm.toString(DIAMOND_FRAME_POOL), "\\");
        console.log("  src/DiamondFramePool.sol:DiamondFramePool \\");
        console.log("  --chain-id", vm.toString(CHAIN_ID), "\\");
        console.log("  --etherscan-api-key $BASESCAN_API_KEY \\");
        console.log("  --verifier-url https://api-sepolia.basescan.org/api \\");
        console.log("  --constructor-args $(cast abi-encode \"constructor(address,uint256)\"", vm.toString(DIAMOND), "100000000000000)");
        console.log("");
        
        console.log("=========================================");
        console.log("Note: Facet addresses need to be retrieved");
        console.log("from the Diamond contract using facetAddress()");
        console.log("or from deployment logs.");
        console.log("=========================================");
        
        // Try to get facet addresses from Diamond (if we can call it)
        console.log("");
        console.log("To get facet addresses, run:");
        console.log("cast call", vm.toString(DIAMOND), "facetAddress(bytes4) SELECTOR --rpc-url base-sepolia");
        console.log("");
        console.log("Or use the DiamondLoupeFacet:");
        console.log("cast call", vm.toString(DIAMOND), "facets() --rpc-url base-sepolia");
    }
}

