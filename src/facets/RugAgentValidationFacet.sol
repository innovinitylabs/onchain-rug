// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";

/**
 * @title RugAgentValidationFacet
 * @notice Agent Validation Showcase
 * @dev Demonstrates cryptographic validation capabilities for educational purposes
 *
 * SHOWCASE FEATURES:
 * - Proof-of-work validation examples
 * - Educational demonstrations of agent verification
 * - Community learning about validation methods
 * - Technical showcase for x402 integration
 * - NO commercial validation services
 */
contract RugAgentValidationFacet {
    using LibRugStorage for LibRugStorage.RugConfig;

    // ========== ENUMS ==========

    /**
     * @notice Validation method types
     * @dev Following ERC-8004 standard for validation methods
     */
    enum ValidationMethod {
        NONE,           // No validation
        CRYPTO_PROOF,   // Cryptographic proof (zkTLS, TEE attestation, etc.)
        ECONOMIC        // Crypto-economic validation (restaking, AVS, etc.)
    }

    // ========== STRUCTS ==========

    /**
     * @notice Validation proof structure following ERC-8004 Validation Registry standard
     * @dev This is the return type - internal storage uses StoredValidationProof
     */
    struct ValidationProof {
        ValidationMethod method;
        bytes proof;
        address validator;      // Address that validated the proof
        uint256 taskId;         // Task identifier (e.g., tokenId for maintenance)
        address agent;          // Agent that performed the task
        uint256 validatedAt;
        bool verified;
    }

    // ========== EVENTS ==========

    event ValidationProofSubmitted(
        address indexed agent,
        uint256 indexed taskId,
        ValidationMethod method,
        address indexed validator,
        uint256 timestamp
    );

    event ValidationProofVerified(
        address indexed agent,
        uint256 indexed taskId,
        ValidationMethod method,
        bool verified
    );

    // ========== ERRORS ==========

    error AgentNotRegistered(address agent);
    error InvalidValidationMethod();
    error ProofAlreadyExists(uint256 taskId);
    error ProofNotFound(uint256 taskId);
    error OnlyValidatorOrAdmin();

    // ========== MODIFIERS ==========

    modifier onlyRegisteredAgent(address agent) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        if (ar.agents[agent].registeredAt == 0) {
            revert AgentNotRegistered(agent);
        }
        _;
    }

    modifier onlyValidatorOrAdmin(address validator) {
        require(
            msg.sender == validator || msg.sender == LibDiamond.contractOwner(),
            "Only validator or admin"
        );
        _;
    }

    // ========== FUNCTIONS ==========

    /**
     * @notice Submit validation proof for a completed task
     * @param agent Address of the agent that performed the task
     * @param taskId Identifier for the task (e.g., tokenId for maintenance)
     * @param method Validation method used
     * @param proof Validation proof data (method-specific format)
     */
    function submitValidationProof(
        address agent,
        uint256 taskId,
        ValidationMethod method,
        bytes memory proof
    ) external onlyRegisteredAgent(agent) {
        if (method == ValidationMethod.NONE) {
            revert InvalidValidationMethod();
        }

        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();

        // Check if proof already exists for this task
        bytes32 proofKey = keccak256(abi.encodePacked(agent, taskId));
        if (avr.proofExists[proofKey]) {
            revert ProofAlreadyExists(taskId);
        }

        // Create and store validation proof
        LibRugStorage.StoredValidationProof memory storedProof = LibRugStorage.StoredValidationProof({
            method: uint8(method),
            proof: proof,
            validator: msg.sender,
            taskId: taskId,
            agent: agent,
            validatedAt: block.timestamp,
            verified: false  // Will be verified separately
        });

        avr.validationProofs[proofKey] = storedProof;
        avr.proofExists[proofKey] = true;

        // Track by agent
        avr.agentProofs[agent].push(proofKey);
        avr.agentProofCount[agent]++;

        // Track by validator
        avr.validatorProofs[msg.sender].push(proofKey);
        avr.validatorProofCount[msg.sender]++;

        emit ValidationProofSubmitted(agent, taskId, method, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a validation proof
     * @param agent Address of the agent
     * @param taskId Task identifier
     * @return verified Whether the proof is verified
     * @dev This is a framework function - actual verification logic depends on validation method
     *      Can be extended to call method-specific verification functions
     */
    function verifyProof(
        address agent,
        uint256 taskId
    ) external returns (bool verified) {
        bytes32 proofKey = keccak256(abi.encodePacked(agent, taskId));
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();

        if (!avr.proofExists[proofKey]) {
            revert ProofNotFound(taskId);
        }

        LibRugStorage.StoredValidationProof storage stored = avr.validationProofs[proofKey];

        // Perform method-specific verification
        ValidationMethod method = ValidationMethod(stored.method);
        
        if (method == ValidationMethod.CRYPTO_PROOF) {
            // Cryptographic proof verification
            // In production, this would verify zkTLS proofs, TEE attestations, etc.
            // For now, we mark as verified if proof data exists (placeholder)
            verified = stored.proof.length > 0;
        } else if (method == ValidationMethod.ECONOMIC) {
            // Economic validation verification
            // In production, this would verify restaking proofs, AVS signatures, etc.
            // For now, we mark as verified if proof data exists (placeholder)
            verified = stored.proof.length > 0;
        } else {
            verified = false;
        }

        // Update verification status
        if (verified && !stored.verified) {
            stored.verified = true;
            avr.verifiedProofCount[agent]++;
            emit ValidationProofVerified(agent, taskId, method, true);
        }

        return verified;
    }

    /**
     * @notice Get validation proof for a task
     * @param agent Address of the agent
     * @param taskId Task identifier
     * @return proof Validation proof structure
     */
    function getValidationProof(
        address agent,
        uint256 taskId
    ) external view returns (ValidationProof memory proof) {
        bytes32 proofKey = keccak256(abi.encodePacked(agent, taskId));
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();

        if (!avr.proofExists[proofKey]) {
            revert ProofNotFound(taskId);
        }

        LibRugStorage.StoredValidationProof storage stored = avr.validationProofs[proofKey];

        proof = ValidationProof({
            method: ValidationMethod(stored.method),
            proof: stored.proof,
            validator: stored.validator,
            taskId: stored.taskId,
            agent: stored.agent,
            validatedAt: stored.validatedAt,
            verified: stored.verified
        });
    }

    /**
     * @notice Check if validation proof exists for a task
     * @param agent Address of the agent
     * @param taskId Task identifier
     * @return exists Whether proof exists
     */
    function proofExists(address agent, uint256 taskId) external view returns (bool exists) {
        bytes32 proofKey = keccak256(abi.encodePacked(agent, taskId));
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();
        return avr.proofExists[proofKey];
    }

    /**
     * @notice Get all validation proofs for an agent
     * @param agent Address of the agent
     * @return proofs Array of validation proofs
     */
    function getAgentProofs(address agent) external view onlyRegisteredAgent(agent) returns (ValidationProof[] memory proofs) {
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();
        bytes32[] storage proofKeys = avr.agentProofs[agent];

        proofs = new ValidationProof[](proofKeys.length);
        
        for (uint256 i = 0; i < proofKeys.length; i++) {
            LibRugStorage.StoredValidationProof storage stored = avr.validationProofs[proofKeys[i]];
            proofs[i] = ValidationProof({
                method: ValidationMethod(stored.method),
                proof: stored.proof,
                validator: stored.validator,
                taskId: stored.taskId,
                agent: stored.agent,
                validatedAt: stored.validatedAt,
                verified: stored.verified
            });
        }
    }

    /**
     * @notice Get validation proof count for an agent
     * @param agent Address of the agent
     * @return count Number of validation proofs
     */
    function getAgentProofCount(address agent) external view returns (uint256 count) {
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();
        return avr.agentProofCount[agent];
    }

    /**
     * @notice Get verified proof count for an agent
     * @param agent Address of the agent
     * @return count Number of verified proofs
     */
    function getAgentVerifiedProofCount(address agent) external view returns (uint256 count) {
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();
        return avr.verifiedProofCount[agent];
    }

    /**
     * @notice Get all proofs validated by a validator
     * @param validator Address of the validator
     * @return proofs Array of validation proofs
     */
    function getValidatorProofs(address validator) external view returns (ValidationProof[] memory proofs) {
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();
        bytes32[] storage proofKeys = avr.validatorProofs[validator];

        proofs = new ValidationProof[](proofKeys.length);
        
        for (uint256 i = 0; i < proofKeys.length; i++) {
            LibRugStorage.StoredValidationProof storage stored = avr.validationProofs[proofKeys[i]];
            proofs[i] = ValidationProof({
                method: ValidationMethod(stored.method),
                proof: stored.proof,
                validator: stored.validator,
                taskId: stored.taskId,
                agent: stored.agent,
                validatedAt: stored.validatedAt,
                verified: stored.verified
            });
        }
    }

    /**
     * @notice Get proof count for a validator
     * @param validator Address of the validator
     * @return count Number of proofs validated
     */
    function getValidatorProofCount(address validator) external view returns (uint256 count) {
        LibRugStorage.AgentValidationRegistry storage avr = LibRugStorage.agentValidationStorage();
        return avr.validatorProofCount[validator];
    }
}

