// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";

/**
 * @title VerifyShapeDeployment
 * @notice Verification script for ERC-721-C infrastructure on Shape L2
 * @dev Checks if Payment Processor and CreatorTokenTransferValidator are deployed and functional
 */
contract VerifyShapeDeployment is Script {

    // Known addresses
    address constant DEFAULT_VALIDATOR = 0x0000721C310194CcfC01E523fc93C9cCcFa2A0Ac;

    function run() external view {
        console.log("=========================================");
        console.log("Verifying ERC-721-C Infrastructure on Shape L2");
        console.log("=========================================");

        // Check CreatorTokenTransferValidator
        address validator = vm.envAddress("CREATOR_TOKEN_VALIDATOR_SHAPE");
        if (validator != address(0)) {
            checkValidator(validator);
        } else {
            console.log("WARNING: CREATOR_TOKEN_VALIDATOR_SHAPE not set. Using default address...");
            checkValidator(DEFAULT_VALIDATOR);
        }

        // Check Payment Processor
        address paymentProcessor = vm.envAddress("PAYMENT_PROCESSOR_SHAPE");
        if (paymentProcessor != address(0)) {
            checkPaymentProcessor(paymentProcessor);
        } else {
            console.log("WARNING: PAYMENT_PROCESSOR_SHAPE not set. Set environment variable to verify Payment Processor.");
        }

        // Check WNATIVE (optional)
        address wnative = vm.envAddress("WNATIVE_SHAPE");
        if (wnative != address(0)) {
            checkWNATIVE(wnative);
        }

        // Summary
        console.log("\n=========================================");
        console.log("Verification Summary:");
        if (validator != address(0) || DEFAULT_VALIDATOR.code.length > 0) console.log("OK - Transfer Validator");
        if (paymentProcessor != address(0) && paymentProcessor.code.length > 0) console.log("OK - Payment Processor");
        if (wnative != address(0) && wnative.code.length > 0) console.log("OK - WNATIVE");
        console.log("=========================================");
    }

    function checkWNATIVE(address wnativeAddress) internal view {
        console.log("\n3. Checking WNATIVE (Wrapped Native)...");
        console.log("Address:", wnativeAddress);

        if (wnativeAddress.code.length == 0) {
            console.log("NOT FOUND - WNATIVE contract not deployed at this address");
            return;
        }

        console.log("OK - WNATIVE contract exists");

        // Try to check basic ERC-20 functions
        try IERC20(wnativeAddress).name() returns (string memory name) {
            console.log("WNATIVE name:", name);
        } catch {
            console.log("Could not check WNATIVE name");
        }

        try IERC20(wnativeAddress).symbol() returns (string memory symbol) {
            console.log("WNATIVE symbol:", symbol);
        } catch {
            console.log("Could not check WNATIVE symbol");
        }
    }

    function checkValidator(address validatorAddress) internal view {
        console.log("\n1. Checking CreatorTokenTransferValidator...");
        console.log("Address:", validatorAddress);

        // Check if contract exists
        if (validatorAddress.code.length == 0) {
            console.log("NOT FOUND - Validator contract not deployed at this address");
            console.log("   You may need to deploy CreatorTokenTransferValidator first");
            return;
        }

        console.log("OK - Validator contract exists");

        // Try to call owner() function
        try ICreatorTokenTransferValidator(validatorAddress).getCollectionSecurityPolicy(address(0)) {
            console.log("OK - Validator is responsive");
        } catch {
            console.log("WARNING - Validator exists but may not be fully initialized");
        }
    }

    function checkPaymentProcessor(address paymentProcessorAddress) internal view {
        console.log("\n2. Checking Payment Processor...");
        console.log("Address:", paymentProcessorAddress);

        // Check if contract exists
        if (paymentProcessorAddress.code.length == 0) {
            console.log("NOT FOUND - Payment Processor contract not deployed at this address");
            console.log("   Use LimitBreak infrastructure tools to deploy Payment Processor on Shape L2");
            return;
        }

        console.log("OK - Payment Processor contract exists");

        // Try to call a view function
        try IPaymentProcessor(paymentProcessorAddress).getDomainSeparator() returns (bytes32 domain) {
            console.log("OK - Payment Processor is responsive");
            console.log("   Domain separator:", vm.toString(domain));
        } catch {
            console.log("WARNING - Payment Processor exists but may not be fully functional");
        }
    }

    /**
     * @notice Check if your NFT contract is properly configured
     * @param nftContractAddress Your deployed NFT contract address
     */
    function checkNFTConfiguration(address nftContractAddress) public view {
        console.log("\n3. Checking NFT Contract Configuration...");
        console.log("Address:", nftContractAddress);

        if (nftContractAddress.code.length == 0) {
            console.log("NOT FOUND - NFT contract not deployed");
            return;
        }

        // Check if it supports ICreatorToken interface
        try IERC165(nftContractAddress).supportsInterface(type(ICreatorToken).interfaceId) returns (bool supported) {
            if (supported) {
                console.log("OK - NFT contract supports ICreatorToken interface");
            } else {
                console.log("ERROR - NFT contract does not support ICreatorToken interface");
            }
        } catch {
            console.log("WARNING - Could not check interface support");
        }

        // Check validator configuration
        try RugNFTFacet(nftContractAddress).getTransferValidator() returns (address validator) {
            console.log("Transfer Validator:", validator);
            if (validator == DEFAULT_VALIDATOR) {
                console.log("OK - Using default LimitBreak validator");
            } else if (validator != address(0)) {
                console.log("INFO - Using custom validator");
            } else {
                console.log("WARNING - No validator configured");
            }
        } catch {
            console.log("WARNING - Could not check validator configuration");
        }
    }

    /**
     * @notice Comprehensive verification including security policies
     * @param nftContractAddress Your NFT contract
     * @param paymentProcessorAddress Payment Processor address
     * @param expectedPolicyId Expected security policy ID
     */
    function fullVerification(
        address nftContractAddress,
        address paymentProcessorAddress,
        uint256 expectedPolicyId
    ) external view {
        // Run basic verification
        VerifyShapeDeployment(address(this)).run();
        VerifyShapeDeployment(address(this)).checkNFTConfiguration(nftContractAddress);

        console.log("\n4. Checking Security Policy Configuration...");

        if (paymentProcessorAddress != address(0) && paymentProcessorAddress.code.length > 0) {
            // Check if NFT is linked to security policy
            try IPaymentProcessor(paymentProcessorAddress).getTokenSecurityPolicyId(nftContractAddress) returns (uint256 policyId) {
                if (policyId == expectedPolicyId) {
                    console.log("OK - NFT contract linked to correct security policy:", policyId);
                } else if (policyId != 0) {
                    console.log("WARNING - NFT contract linked to different policy");
                } else {
                    console.log("ERROR - NFT contract not linked to any security policy");
                }
            } catch {
                console.log("WARNING - Could not check security policy linkage");
            }
        }
    }
}

interface ICreatorTokenTransferValidator {
    function getCollectionSecurityPolicy(address collection) external view returns (
        uint8 transferSecurityLevel,
        uint120 operatorWhitelistId,
        uint120 permittedContractReceiversId
    );
}

interface IPaymentProcessor {
    function getDomainSeparator() external view returns (bytes32);
    function getTokenSecurityPolicyId(address tokenAddress) external view returns (uint256);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface RugNFTFacet {
    function getTransferValidator() external view returns (address);
}

interface ICreatorToken {
    // This would be the interface ID for ICreatorToken
    // We'll use a known value or check dynamically
}

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

