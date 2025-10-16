// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title LibTransferSecurity
 * @notice Library for managing ERC721-C transfer security settings
 * @dev Stores transfer validator and security policy configuration
 */
library LibTransferSecurity {
    
    bytes32 constant TRANSFER_SECURITY_STORAGE_POSITION = keccak256("rug.transfer.security.storage");

    struct TransferSecurityStorage {
        address transferValidator;           // ERC721-C transfer validator address
        uint256 securityPolicyId;           // Payment Processor security policy ID
        bool enforcedTransfers;             // Whether transfer enforcement is active
        bool initialized;                   // Whether security has been initialized
    }

    function transferSecurityStorage() internal pure returns (TransferSecurityStorage storage ts) {
        bytes32 position = TRANSFER_SECURITY_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }

    /**
     * @notice Initialize transfer security with default validator
     * @param validator Address of the transfer validator contract
     */
    function initializeTransferSecurity(address validator) internal {
        TransferSecurityStorage storage ts = transferSecurityStorage();
        require(!ts.initialized, "Already initialized");
        require(validator != address(0), "Invalid validator");
        
        ts.transferValidator = validator;
        ts.enforcedTransfers = true;
        ts.initialized = true;
    }

    /**
     * @notice Set the transfer validator address
     * @param validator New transfer validator address
     */
    function setTransferValidator(address validator) internal {
        require(validator != address(0), "Invalid validator");
        TransferSecurityStorage storage ts = transferSecurityStorage();
        ts.transferValidator = validator;
    }

    /**
     * @notice Set the Payment Processor security policy ID
     * @param policyId Security policy ID
     */
    function setSecurityPolicyId(uint256 policyId) internal {
        TransferSecurityStorage storage ts = transferSecurityStorage();
        ts.securityPolicyId = policyId;
    }

    /**
     * @notice Enable or disable transfer enforcement
     * @param enforced Whether to enforce transfers
     */
    function setEnforcedTransfers(bool enforced) internal {
        TransferSecurityStorage storage ts = transferSecurityStorage();
        ts.enforcedTransfers = enforced;
    }

    /**
     * @notice Get the transfer validator address
     * @return Address of the transfer validator
     */
    function getTransferValidator() internal view returns (address) {
        return transferSecurityStorage().transferValidator;
    }

    /**
     * @notice Get the security policy ID
     * @return Security policy ID
     */
    function getSecurityPolicyId() internal view returns (uint256) {
        return transferSecurityStorage().securityPolicyId;
    }

    /**
     * @notice Check if transfers are enforced
     * @return True if transfers are enforced
     */
    function areTransfersEnforced() internal view returns (bool) {
        return transferSecurityStorage().enforcedTransfers;
    }

    /**
     * @notice Check if security is initialized
     * @return True if initialized
     */
    function isInitialized() internal view returns (bool) {
        return transferSecurityStorage().initialized;
    }
}

