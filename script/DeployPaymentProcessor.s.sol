// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";

// Note: Payment Processor uses Solidity 0.8.9, so we can't import it directly
// Instead, we'll interact with the already-deployed Payment Processor contracts
// Mainnet: 0x009a1dC629242961C9E4f089b437aFD394474cc0  
// Sepolia: 0x009a1D8DE8D80Fcd9C6aaAFE97A237dC663f2978

interface IPaymentProcessor {
    function createSecurityPolicy(
        bool enforceExchangeWhitelist,
        bool enforcePaymentMethodWhitelist,
        bool enforcePricingConstraints,
        bool disablePrivateListings,
        bool disableDelegatedPurchases,
        bool disableEIP1271Signatures,
        bool disableExchangeWhitelistEOABypass,
        uint32 pushPaymentGasLimit,
        string calldata registryName
    ) external returns (uint256);

    function whitelistPaymentMethod(uint256 securityPolicyId, address coin) external;
    function setCollectionSecurityPolicy(address tokenAddress, uint256 securityPolicyId) external;
}

/**
 * @title DeployPaymentProcessor
 * @notice Configuration script for Payment Processor security policies
 * @dev Uses already-deployed Payment Processor on Shape Sepolia
 */
contract DeployPaymentProcessor is Script {
    
    // Payment Processor addresses (already deployed by LimitBreak)
    address constant PAYMENT_PROCESSOR_SEPOLIA = 0x009a1D8DE8D80Fcd9C6aaAFE97A237dC663f2978;
    address constant PAYMENT_PROCESSOR_MAINNET = 0x009a1dC629242961C9E4f089b437aFD394474cc0;
    
    // Default addresses for Shape Sepolia
    address constant WETH_SHAPE_SEPOLIA = address(0); // TODO: Add actual WETH address when available
    address constant USDC_SHAPE_SEPOLIA = address(0); // TODO: Add actual USDC address when available

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Configuring Payment Processor security policy...");
        console.log("Deployer:", deployer);
        console.log("Using Payment Processor at:", PAYMENT_PROCESSOR_SEPOLIA);

        vm.startBroadcast(deployerPrivateKey);

        // Get Payment Processor instance
        IPaymentProcessor paymentProcessor = IPaymentProcessor(PAYMENT_PROCESSOR_SEPOLIA);

        // Create default security policy for OnchainRugs collection
        // enforceExchangeWhitelist: false (allow any marketplace initially)
        // enforcePaymentMethodWhitelist: true (whitelist specific payment methods)
        // enforcePricingConstraints: false (no price restrictions initially)
        // disablePrivateListings: false (allow private sales)
        // disableDelegatedPurchases: false (allow delegated purchases)
        // disableEIP1271Signatures: false (allow multisig wallets)
        // disableExchangeWhitelistEOABypass: false (allow EOA bypass)
        // pushPaymentGasLimit: 2300 (standard gas limit for ETH transfers)
        
        uint256 securityPolicyId = paymentProcessor.createSecurityPolicy(
            false,  // enforceExchangeWhitelist
            true,   // enforcePaymentMethodWhitelist
            false,  // enforcePricingConstraints
            false,  // disablePrivateListings
            false,  // disableDelegatedPurchases
            false,  // disableEIP1271Signatures
            false,  // disableExchangeWhitelistEOABypass
            2300,   // pushPaymentGasLimit
            "OnchainRugs Default Policy"
        );

        console.log("Created security policy with ID:", securityPolicyId);

        // Whitelist ETH as payment method (address(0) represents native ETH)
        paymentProcessor.whitelistPaymentMethod(securityPolicyId, address(0));
        console.log("Whitelisted ETH as payment method");

        // If WETH is available, whitelist it
        if (WETH_SHAPE_SEPOLIA != address(0)) {
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, WETH_SHAPE_SEPOLIA);
            console.log("Whitelisted WETH at:", WETH_SHAPE_SEPOLIA);
        }

        // If USDC is available, whitelist it
        if (USDC_SHAPE_SEPOLIA != address(0)) {
            paymentProcessor.whitelistPaymentMethod(securityPolicyId, USDC_SHAPE_SEPOLIA);
            console.log("Whitelisted USDC at:", USDC_SHAPE_SEPOLIA);
        }

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== Configuration Summary ===");
        console.log("Payment Processor:", PAYMENT_PROCESSOR_SEPOLIA);
        console.log("Security Policy ID:", securityPolicyId);
        console.log("Policy Owner:", deployer);
        console.log("\nNext Steps:");
        console.log("1. Call setCollectionSecurityPolicy() on your NFT contract with policy ID:", securityPolicyId);
        console.log("2. Configure royalty info using configureRoyalties()");
        console.log("3. Set pricing bounds if needed using setCollectionPricingBounds()");
        console.log("4. Update your diamond contract to use this Payment Processor");
    }

    /**
     * @notice Create a strict security policy (for production use)
     * @dev This creates a more restrictive policy that can be used for mainnet
     */
    function createStrictPolicy() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Use the already deployed Payment Processor
        IPaymentProcessor paymentProcessor = IPaymentProcessor(PAYMENT_PROCESSOR_SEPOLIA);

        // Create strict security policy
        // enforceExchangeWhitelist: true (only whitelisted marketplaces)
        // enforcePaymentMethodWhitelist: true (only whitelisted payment methods)
        // enforcePricingConstraints: true (enforce floor/ceiling prices)
        // disablePrivateListings: true (no private sales)
        // disableDelegatedPurchases: true (no delegated purchases)
        // disableEIP1271Signatures: false (allow multisig wallets)
        // disableExchangeWhitelistEOABypass: true (require marketplace for all sales)
        
        uint256 strictPolicyId = paymentProcessor.createSecurityPolicy(
            true,   // enforceExchangeWhitelist
            true,   // enforcePaymentMethodWhitelist
            true,   // enforcePricingConstraints
            true,   // disablePrivateListings
            true,   // disableDelegatedPurchases
            false,  // disableEIP1271Signatures
            true,   // disableExchangeWhitelistEOABypass
            2300,   // pushPaymentGasLimit
            "OnchainRugs Strict Policy"
        );

        console.log("Created strict security policy with ID:", strictPolicyId);

        // Whitelist only ETH for strict policy
        paymentProcessor.whitelistPaymentMethod(strictPolicyId, address(0));

        vm.stopBroadcast();

        console.log("\n=== Strict Policy Created ===");
        console.log("Policy ID:", strictPolicyId);
        console.log("This policy enforces:");
        console.log("- Whitelisted marketplaces only");
        console.log("- Whitelisted payment methods only");
        console.log("- Price floor and ceiling enforcement");
        console.log("- No private sales");
        console.log("- No delegated purchases");
        console.log("- Marketplace required for all transfers");
    }
}

