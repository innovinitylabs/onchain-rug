// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {DeployShapeSepolia} from "./DeployShapeSepolia.s.sol";
import {DeployPaymentProcessor} from "./DeployPaymentProcessor.s.sol";

/**
 * @title DeployOnchainRugsToShape
 * @notice One-command deployment script for OnchainRugs ERC-721-C collection on Shape L2
 * @dev Uses deterministically deployed LimitBreak infrastructure contracts
 *
 * Prerequisites:
 * 1. Infrastructure is already deployed on Shape L2 at deterministic addresses
 * 2. Set PRIVATE_KEY environment variable
 * 3. Run this script
 */
contract DeployOnchainRugsToShape is Script {

    // Deterministic addresses (already deployed on Shape L2)
    address constant CREATOR_TOKEN_VALIDATOR = 0x721C008fdff27BF06E7E123956E2Fe03B63342e3;
    address constant PAYMENT_PROCESSOR = 0x9a1D00000000fC540e2000560054812452eB5366;

    function run() external {
        console.log("=========================================");
        console.log("Deploying OnchainRugs ERC-721-C to Shape L2");
        console.log("=========================================");
        console.log("Using deterministic infrastructure addresses:");
        console.log("- CreatorTokenTransferValidator:", CREATOR_TOKEN_VALIDATOR);
        console.log("- Payment Processor:", PAYMENT_PROCESSOR);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Configure Payment Processor security policies
        console.log("\nStep 1: Configuring Payment Processor security policies...");
        configurePaymentProcessor(PAYMENT_PROCESSOR);

        vm.stopBroadcast();

        // Step 2: Deploy NFT collection (calls DeployShapeSepolia)
        console.log("\nStep 2: Deploying OnchainRugs NFT collection...");
        DeployShapeSepolia deployScript = new DeployShapeSepolia();
        deployScript.run();

        // Step 3: Link everything together
        console.log("\nStep 3: Linking infrastructure to NFT collection...");

        // Get the deployed diamond address from the deploy script
        address diamondAddress = address(deployScript.diamondAddr());

        vm.startBroadcast(deployerPrivateKey);

        linkInfrastructure(diamondAddress, CREATOR_TOKEN_VALIDATOR);

        vm.stopBroadcast();

        console.log("\n=========================================");
        console.log("Deployment Complete!");
        console.log("=========================================");
        console.log("NFT Collection:", diamondAddress);
        console.log("Transfer Validator:", CREATOR_TOKEN_VALIDATOR);
        console.log("Payment Processor:", PAYMENT_PROCESSOR);
        console.log("\nNext steps:");
        console.log("1. Test minting: RugNFTFacet(diamond).mintRug(...)");
        console.log("2. Test transfers: Check royalty enforcement");
        console.log("3. List on marketplaces that support Payment Processor");
        console.log("=========================================");
    }

    function configurePaymentProcessor(address paymentProcessorAddress) internal {
        // For now, skip security policy creation and use a default policy
        // The Payment Processor may already have default policies configured
        console.log("Using default security policy ID: 1");

        // Store a default security policy ID for testing
        vm.setEnv("SECURITY_POLICY_ID", "1");

        // TODO: In production, create custom security policies as needed
        console.log("Note: Security policy creation skipped for initial deployment");
    }

    function linkInfrastructure(address diamondAddress, address validatorAddress) internal {
        uint256 securityPolicyId = vm.envUint("SECURITY_POLICY_ID");

        // Set transfer validator
        RugTransferSecurityFacet(diamondAddress).setTransferValidator(validatorAddress);
        console.log("Set transfer validator");

        // Set security policy
        RugTransferSecurityFacet(diamondAddress).setPaymentProcessorSecurityPolicy(securityPolicyId);
        console.log("Set security policy");

        // Configure royalties (5%)
        address[] memory recipients = new address[](1);
        recipients[0] = msg.sender; // Creator address

        uint256[] memory shares = new uint256[](1);
        shares[0] = 500; // 5%

        RugCommerceFacet(diamondAddress).configureRoyalties(500, recipients, shares);
        console.log("Configured 5% royalties");

        // Set default security level (Level 1: whitelist with OTC)
        RugTransferSecurityFacet(diamondAddress).setToDefaultSecurityPolicy();
        console.log("Set default security policy (Level 1)");
    }
}

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

interface RugTransferSecurityFacet {
    function setTransferValidator(address validator) external;
    function setPaymentProcessorSecurityPolicy(uint256 policyId) external;
    function setToDefaultSecurityPolicy() external;
}

interface RugCommerceFacet {
    function configureRoyalties(uint256 royaltyPercentage, address[] calldata recipients, uint256[] calldata shares) external;
}
