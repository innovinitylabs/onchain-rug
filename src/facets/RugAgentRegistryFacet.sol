// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";

/**
 * @title RugAgentRegistryFacet
 * @notice ERC-8004 compliant agent identity registry for OnchainRugs
 * @dev Allows AI agents to register their identity with capabilities and metadata
 * 
 * This facet implements the Identity Registry component of ERC-8004:
 * - Agents can register their "Agent Card" with metadata
 * - Supports capability-based agent discovery
 * - Integrates with existing authorization system
 */
contract RugAgentRegistryFacet {
    using LibRugStorage for LibRugStorage.RugConfig;

    // ========== STRUCTS ==========

    /**
     * @notice Agent Card structure following ERC-8004 Identity Registry standard
     * @param agentId Unique identifier for the agent (e.g., "rug-cleaner-v1")
     * @param name Human-readable name (e.g., "RugBot Pro")
     * @param description Human-readable description of the agent
     * @param evmAddress Agent's wallet address
     * @param capabilities Array of capability strings (e.g., ["rug_cleaning", "rug_restoration"])
     * @param metadataURI Optional URI to off-chain metadata (JSON)
     * @param registeredAt Timestamp when agent was registered
     * @param updatedAt Timestamp when agent info was last updated
     * @param active Whether the agent is currently active
     */
    struct AgentCard {
        string agentId;
        string name;
        string description;
        address evmAddress;
        string[] capabilities;
        string metadataURI;
        uint256 registeredAt;
        uint256 updatedAt;
        bool active;
    }

    // ========== EVENTS ==========

    event AgentRegistered(
        address indexed agentAddress,
        string indexed agentId,
        string name,
        string[] capabilities
    );

    event AgentUpdated(
        address indexed agentAddress,
        string indexed agentId,
        string name,
        string[] capabilities
    );

    event AgentDeactivated(
        address indexed agentAddress,
        string indexed agentId
    );

    event AgentReactivated(
        address indexed agentAddress,
        string indexed agentId
    );

    // ========== ERRORS ==========

    error AgentAlreadyRegistered(address agent);
    error AgentNotRegistered(address agent);
    error InvalidAgentAddress();
    error EmptyAgentId();
    error EmptyName();
    error Unauthorized(); // Agent can only update their own card

    // ========== MODIFIERS ==========

    modifier onlyRegisteredAgent(address agent) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        if (ar.agents[agent].registeredAt == 0) {
            revert AgentNotRegistered(agent);
        }
        _;
    }

    modifier onlySelfOrAdmin(address agent) {
        if (msg.sender != agent && msg.sender != LibDiamond.contractOwner()) {
            revert Unauthorized();
        }
        _;
    }

    // ========== FUNCTIONS ==========

    /**
     * @notice Register a new agent identity
     * @param card Agent card with all identity information
     */
    function registerAgent(AgentCard memory card) external {
        if (card.evmAddress == address(0)) {
            revert InvalidAgentAddress();
        }
        if (bytes(card.agentId).length == 0) {
            revert EmptyAgentId();
        }
        if (bytes(card.name).length == 0) {
            revert EmptyName();
        }

        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();

        // Check if agent is already registered
        if (ar.agents[card.evmAddress].registeredAt > 0) {
            revert AgentAlreadyRegistered(card.evmAddress);
        }

        // Only agent themselves can register (or admin)
        require(
            msg.sender == card.evmAddress || msg.sender == LibDiamond.contractOwner(),
            "Only agent or admin can register"
        );

        // Store agent card
        ar.agents[card.evmAddress] = LibRugStorage.StoredAgentCard({
            agentId: card.agentId,
            name: card.name,
            description: card.description,
            evmAddress: card.evmAddress,
            capabilities: card.capabilities,
            metadataURI: card.metadataURI,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true
        });

        // Add to all agents list
        ar.allAgents.push(card.evmAddress);

        // Index by capability
        for (uint256 i = 0; i < card.capabilities.length; i++) {
            string memory capability = card.capabilities[i];
            ar.agentsByCapability[capability].push(card.evmAddress);
        }

        emit AgentRegistered(card.evmAddress, card.agentId, card.name, card.capabilities);
    }

    /**
     * @notice Update agent identity information
     * @param card Updated agent card (must include same evmAddress)
     */
    function updateAgent(AgentCard memory card) external onlySelfOrAdmin(card.evmAddress) onlyRegisteredAgent(card.evmAddress) {
        if (bytes(card.agentId).length == 0) {
            revert EmptyAgentId();
        }
        if (bytes(card.name).length == 0) {
            revert EmptyName();
        }

        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        LibRugStorage.StoredAgentCard storage stored = ar.agents[card.evmAddress];

        // Remove old capability indices
        string[] memory oldCapabilities = stored.capabilities;
        for (uint256 i = 0; i < oldCapabilities.length; i++) {
            string memory capability = oldCapabilities[i];
            _removeAgentFromCapability(capability, card.evmAddress);
        }

        // Update stored card
        stored.agentId = card.agentId;
        stored.name = card.name;
        stored.description = card.description;
        stored.capabilities = card.capabilities;
        stored.metadataURI = card.metadataURI;
        stored.updatedAt = block.timestamp;

        // Add new capability indices
        for (uint256 i = 0; i < card.capabilities.length; i++) {
            string memory capability = card.capabilities[i];
            // Avoid duplicates
            bool exists = false;
            address[] storage agents = ar.agentsByCapability[capability];
            for (uint256 j = 0; j < agents.length; j++) {
                if (agents[j] == card.evmAddress) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                agents.push(card.evmAddress);
            }
        }

        emit AgentUpdated(card.evmAddress, card.agentId, card.name, card.capabilities);
    }

    /**
     * @notice Deactivate an agent (agent can deactivate themselves, or admin)
     * @param agentAddress Address of agent to deactivate
     */
    function deactivateAgent(address agentAddress) external onlySelfOrAdmin(agentAddress) onlyRegisteredAgent(agentAddress) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        LibRugStorage.StoredAgentCard storage stored = ar.agents[agentAddress];

        if (!stored.active) {
            return; // Already deactivated
        }

        stored.active = false;
        stored.updatedAt = block.timestamp;

        emit AgentDeactivated(agentAddress, stored.agentId);
    }

    /**
     * @notice Reactivate an agent (agent can reactivate themselves, or admin)
     * @param agentAddress Address of agent to reactivate
     */
    function reactivateAgent(address agentAddress) external onlySelfOrAdmin(agentAddress) onlyRegisteredAgent(agentAddress) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        LibRugStorage.StoredAgentCard storage stored = ar.agents[agentAddress];

        if (stored.active) {
            return; // Already active
        }

        stored.active = true;
        stored.updatedAt = block.timestamp;

        emit AgentReactivated(agentAddress, stored.agentId);
    }

    /**
     * @notice Get agent card by address
     * @param agentAddress Address of the agent
     * @return card Agent card structure
     */
    function getAgent(address agentAddress) external view returns (AgentCard memory card) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        LibRugStorage.StoredAgentCard storage stored = ar.agents[agentAddress];

        if (stored.registeredAt == 0) {
            revert AgentNotRegistered(agentAddress);
        }

        card = AgentCard({
            agentId: stored.agentId,
            name: stored.name,
            description: stored.description,
            evmAddress: stored.evmAddress,
            capabilities: stored.capabilities,
            metadataURI: stored.metadataURI,
            registeredAt: stored.registeredAt,
            updatedAt: stored.updatedAt,
            active: stored.active
        });
    }

    /**
     * @notice Search agents by capability
     * @param capability Capability string to search for
     * @return agents Array of agent addresses with this capability
     */
    function searchAgentsByCapability(string memory capability) external view returns (address[] memory agents) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        address[] storage capabilityAgents = ar.agentsByCapability[capability];

        // Filter to only active agents
        uint256 activeCount = 0;
        for (uint256 i = 0; i < capabilityAgents.length; i++) {
            if (ar.agents[capabilityAgents[i]].active) {
                activeCount++;
            }
        }

        agents = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < capabilityAgents.length; i++) {
            address agent = capabilityAgents[i];
            if (ar.agents[agent].active) {
                agents[index] = agent;
                index++;
            }
        }
    }

    /**
     * @notice Get all registered agents
     * @return agents Array of all agent addresses
     */
    function getAllAgents() external view returns (address[] memory agents) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        return ar.allAgents;
    }

    /**
     * @notice Get all active agents
     * @return agents Array of active agent addresses
     */
    function getActiveAgents() external view returns (address[] memory agents) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        
        uint256 activeCount = 0;
        for (uint256 i = 0; i < ar.allAgents.length; i++) {
            if (ar.agents[ar.allAgents[i]].active) {
                activeCount++;
            }
        }

        agents = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ar.allAgents.length; i++) {
            address agent = ar.allAgents[i];
            if (ar.agents[agent].active) {
                agents[index] = agent;
                index++;
            }
        }
    }

    /**
     * @notice Check if an agent is registered
     * @param agentAddress Address to check
     * @return isRegistered True if agent is registered
     */
    function isAgentRegistered(address agentAddress) external view returns (bool isRegistered) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        return ar.agents[agentAddress].registeredAt > 0;
    }

    /**
     * @notice Check if an agent is registered and active
     * @param agentAddress Address to check
     * @return isActive True if agent is registered and active
     */
    function isAgentActive(address agentAddress) external view returns (bool isActive) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        LibRugStorage.StoredAgentCard storage stored = ar.agents[agentAddress];
        return stored.registeredAt > 0 && stored.active;
    }

    // ========== INTERNAL FUNCTIONS ==========

    /**
     * @notice Remove agent from capability index (helper function)
     * @param capability Capability string
     * @param agentAddress Agent address to remove
     */
    function _removeAgentFromCapability(string memory capability, address agentAddress) internal {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        address[] storage agents = ar.agentsByCapability[capability];

        for (uint256 i = 0; i < agents.length; i++) {
            if (agents[i] == agentAddress) {
                // Move last element to this position and pop
                agents[i] = agents[agents.length - 1];
                agents.pop();
                break;
            }
        }
    }
}

