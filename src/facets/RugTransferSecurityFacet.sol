// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/////////////////////////////////////////////////////////////////////////////////////////////////
/// ██╗   ██╗ █████╗ ██╗     ██╗██████╗  ██████╗ ██╗  ██╗██╗  ██╗ █████╗ ███╗   ██╗███╗   ██╗ ///
/// ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔═══██╗██║ ██╔╝██║ ██╔╝██╔══██╗████╗  ██║████╗  ██║ ///
/// ██║   ██║███████║██║     ██║██████╔╝██║   ██║█████╔╝ █████╔╝ ███████║██╔██╗ ██║██╔██╗ ██║ ///
/// ╚██╗ ██╔╝██╔══██║██║     ██║██╔═══╝ ██║   ██║██╔═██╗ ██╔═██╗ ██╔══██║██║╚██╗██║██║╚██╗██║ ///
///  ╚████╔╝ ██║  ██║███████╗██║██║     ╚██████╔╝██║  ██╗██║  ██╗██║  ██║██║ ╚████║██║ ╚████║ ///
///   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ///
/////////////////////////////////////////////////////////////////////////////////////////////////

import {LibTransferSecurity} from "../libraries/LibTransferSecurity.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {ICreatorTokenTransferValidator} from "@limitbreak/creator-token-contracts/interfaces/ICreatorTokenTransferValidator.sol";
import {TransferSecurityLevels, CollectionSecurityPolicy} from "@limitbreak/creator-token-contracts/utils/TransferPolicy.sol";

/**
 * @title RugTransferSecurityFacet
 * @notice Manages ERC721-C transfer security and Payment Processor integration
 * @dev Handles transfer validator configuration and security policies
 */
contract RugTransferSecurityFacet {

    // Events
    event TransferValidatorUpdated(address indexed oldValidator, address indexed newValidator);
    event SecurityPolicyUpdated(uint256 indexed policyId);
    event TransferEnforcementUpdated(bool enforced);
    event SecurityPolicyConfigured(
        TransferSecurityLevels level,
        uint120 operatorWhitelistId,
        uint120 permittedContractReceiversId
    );

    // Constants - LimitBreak CreatorTokenTransferValidator v5.0.0 (deterministic address)
    address public constant DEFAULT_TRANSFER_VALIDATOR = 0x721C008fdff27BF06E7E123956E2Fe03B63342e3;
    TransferSecurityLevels public constant DEFAULT_TRANSFER_SECURITY_LEVEL = TransferSecurityLevels.One;
    uint120 public constant DEFAULT_OPERATOR_WHITELIST_ID = uint120(1);

    /**
     * @notice Initialize transfer security with default validator
     */
    function initializeTransferSecurity() external {
        LibDiamond.enforceIsContractOwner();
        LibTransferSecurity.initializeTransferSecurity(DEFAULT_TRANSFER_VALIDATOR);
        emit TransferValidatorUpdated(address(0), DEFAULT_TRANSFER_VALIDATOR);
    }

    /**
     * @notice Set transfer validator address
     * @param validator New transfer validator address
     */
    function setTransferValidator(address validator) external {
        LibDiamond.enforceIsContractOwner();
        address oldValidator = LibTransferSecurity.getTransferValidator();
        LibTransferSecurity.setTransferValidator(validator);
        emit TransferValidatorUpdated(oldValidator, validator);
    }

    /**
     * @notice Set to default security policy (recommended settings)
     */
    function setToDefaultSecurityPolicy() external {
        LibDiamond.enforceIsContractOwner();
        address validator = LibTransferSecurity.getTransferValidator();
        require(validator != address(0), "Validator not set");

        ICreatorTokenTransferValidator(validator).setTransferSecurityLevelOfCollection(
            address(this),
            DEFAULT_TRANSFER_SECURITY_LEVEL
        );
        
        ICreatorTokenTransferValidator(validator).setOperatorWhitelistOfCollection(
            address(this),
            DEFAULT_OPERATOR_WHITELIST_ID
        );

        emit SecurityPolicyConfigured(
            DEFAULT_TRANSFER_SECURITY_LEVEL,
            DEFAULT_OPERATOR_WHITELIST_ID,
            0
        );
    }

    /**
     * @notice Set custom security policy
     * @param level Transfer security level
     * @param operatorWhitelistId Operator whitelist ID
     * @param permittedContractReceiversId Permitted contract receivers ID
     */
    function setToCustomSecurityPolicy(
        TransferSecurityLevels level,
        uint120 operatorWhitelistId,
        uint120 permittedContractReceiversId
    ) external {
        LibDiamond.enforceIsContractOwner();
        address validator = LibTransferSecurity.getTransferValidator();
        require(validator != address(0), "Validator not set");

        ICreatorTokenTransferValidator validatorContract = ICreatorTokenTransferValidator(validator);
        
        validatorContract.setTransferSecurityLevelOfCollection(address(this), level);
        validatorContract.setOperatorWhitelistOfCollection(address(this), operatorWhitelistId);
        validatorContract.setPermittedContractReceiverAllowlistOfCollection(
            address(this),
            permittedContractReceiversId
        );

        emit SecurityPolicyConfigured(level, operatorWhitelistId, permittedContractReceiversId);
    }

    /**
     * @notice Set Payment Processor security policy ID
     * @param policyId Security policy ID from Payment Processor
     */
    function setPaymentProcessorSecurityPolicy(uint256 policyId) external {
        LibDiamond.enforceIsContractOwner();
        LibTransferSecurity.setSecurityPolicyId(policyId);
        emit SecurityPolicyUpdated(policyId);
    }

    /**
     * @notice Enable or disable transfer enforcement
     * @param enforced Whether to enforce transfers
     */
    function setTransferEnforcement(bool enforced) external {
        LibDiamond.enforceIsContractOwner();
        LibTransferSecurity.setEnforcedTransfers(enforced);
        emit TransferEnforcementUpdated(enforced);
    }

    // View functions

    /**
     * @notice Get transfer validator address
     * @return validator Transfer validator address
     */
    function getTransferValidator() external view returns (address) {
        return LibTransferSecurity.getTransferValidator();
    }

    /**
     * @notice Get Payment Processor security policy ID
     * @return policyId Security policy ID
     */
    function getSecurityPolicyId() external view returns (uint256) {
        return LibTransferSecurity.getSecurityPolicyId();
    }

    /**
     * @notice Check if transfers are enforced
     * @return enforced True if transfers are enforced
     */
    function areTransfersEnforced() external view returns (bool) {
        return LibTransferSecurity.areTransfersEnforced();
    }

    /**
     * @notice Check if security is initialized
     * @return initialized True if initialized
     */
    function isSecurityInitialized() external view returns (bool) {
        return LibTransferSecurity.isInitialized();
    }

    /**
     * @notice Get current security policy from validator
     * @return level Transfer security level
     * @return operatorWhitelistId Operator whitelist ID
     * @return permittedContractReceiversId Permitted contract receivers ID
     */
    function getSecurityPolicy() external view returns (
        TransferSecurityLevels level,
        uint120 operatorWhitelistId,
        uint120 permittedContractReceiversId
    ) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) {
            return (TransferSecurityLevels.Zero, 0, 0);
        }

        ICreatorTokenTransferValidator validatorContract = ICreatorTokenTransferValidator(validator);
        
        // Get the full security policy from the registry
        try validatorContract.getCollectionSecurityPolicy(address(this)) returns (
            CollectionSecurityPolicy memory policy
        ) {
            return (policy.transferSecurityLevel, policy.operatorWhitelistId, policy.permittedContractReceiversId);
        } catch {
            return (TransferSecurityLevels.Zero, 0, 0);
        }
    }
}

