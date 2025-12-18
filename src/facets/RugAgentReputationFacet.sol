// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";

/**
 * @title RugAgentReputationFacet
 * @notice ERC-8004 compliant agent reputation registry for OnchainRugs
 * @dev Allows clients to submit feedback about agents and tracks reputation scores
 * 
 * This facet implements the Reputation Registry component of ERC-8004:
 * - Clients submit structured feedback after task completion
 * - Reputation scores calculated from feedback
 * - Supports multiple rating dimensions (accuracy, timeliness, reliability)
 */
contract RugAgentReputationFacet {
    using LibRugStorage for LibRugStorage.RugConfig;

    // ========== STRUCTS ==========

    /**
     * @notice Feedback structure following ERC-8004 Reputation Registry standard
     * @param client Address of the client submitting feedback
     * @param taskId Identifier for the completed task (e.g., tokenId for maintenance)
     * @param accuracy Rating 1-5 for accuracy of work
     * @param timeliness Rating 1-5 for timeliness of completion
     * @param reliability Rating 1-5 for reliability/consistency
     * @param comment Optional text comment
     * @param timestamp When feedback was submitted
     */
    struct Feedback {
        address client;
        uint256 taskId;
        uint8 accuracy;      // 1-5
        uint8 timeliness;    // 1-5
        uint8 reliability;   // 1-5
        string comment;
        uint256 timestamp;
    }

    /**
     * @notice Agent Reputation summary
     * @param totalTasks Total number of tasks completed
     * @param totalFeedback Total number of feedback submissions
     * @param averageAccuracy Average accuracy rating (1-5, scaled to basis points)
     * @param averageTimeliness Average timeliness rating (1-5, scaled to basis points)
     * @param averageReliability Average reliability rating (1-5, scaled to basis points)
     * @param reputationScore Overall reputation score (0-100, calculated)
     */
    struct AgentReputation {
        uint256 totalTasks;
        uint256 totalFeedback;
        uint256 averageAccuracy;      // Scaled to basis points (100 = 1.0, 500 = 5.0)
        uint256 averageTimeliness;    // Scaled to basis points
        uint256 averageReliability;   // Scaled to basis points
        uint256 reputationScore;      // 0-100 (calculated weighted score)
    }

    // ========== CONSTANTS ==========

    uint8 private constant MIN_RATING = 1;
    uint8 private constant MAX_RATING = 5;
    uint256 private constant BASIS_POINTS = 100;

    // ========== EVENTS ==========

    event FeedbackSubmitted(
        address indexed agent,
        address indexed client,
        uint256 indexed taskId,
        uint8 accuracy,
        uint8 timeliness,
        uint8 reliability,
        uint256 timestamp
    );

    event ReputationUpdated(
        address indexed agent,
        uint256 totalFeedback,
        uint256 reputationScore
    );

    // ========== ERRORS ==========

    error AgentNotRegistered(address agent);
    error InvalidRating(uint8 rating, string dimension);
    error InvalidTaskId();
    error OnlyClientOrAdmin();
    error FeedbackAlreadySubmitted(uint256 taskId);

    // ========== MODIFIERS ==========

    modifier onlyRegisteredAgent(address agent) {
        LibRugStorage.AgentRegistry storage ar = LibRugStorage.agentRegistry();
        if (ar.agents[agent].registeredAt == 0) {
            revert AgentNotRegistered(agent);
        }
        _;
    }

    modifier validRating(uint8 rating) {
        if (rating < MIN_RATING || rating > MAX_RATING) {
            revert InvalidRating(rating, "rating");
        }
        _;
    }

    // ========== FUNCTIONS ==========

    /**
     * @notice Submit feedback for an agent after task completion
     * @param agent Address of the agent being rated
     * @param taskId Identifier for the completed task
     * @param accuracy Accuracy rating (1-5)
     * @param timeliness Timeliness rating (1-5)
     * @param reliability Reliability rating (1-5)
     * @param comment Optional comment
     */
    function submitFeedback(
        address agent,
        uint256 taskId,
        uint8 accuracy,
        uint8 timeliness,
        uint8 reliability,
        string memory comment
    ) external validRating(accuracy) validRating(timeliness) validRating(reliability) onlyRegisteredAgent(agent) {
        // Only client (msg.sender) or admin can submit feedback
        // In practice, this would be called by the NFT owner after agent performs maintenance
        require(
            msg.sender == LibDiamond.contractOwner() || msg.sender != agent,
            "Only client or admin can submit feedback"
        );

        LibRugStorage.AgentReputationRegistry storage arr = LibRugStorage.agentReputationStorage();

        // Check if feedback already submitted for this task (prevent duplicates)
        bytes32 feedbackKey = keccak256(abi.encodePacked(agent, taskId, msg.sender));
        if (arr.feedbackExists[feedbackKey]) {
            revert FeedbackAlreadySubmitted(taskId);
        }

        // Create and store feedback
        LibRugStorage.StoredFeedback memory storedFeedback = LibRugStorage.StoredFeedback({
            client: msg.sender,
            taskId: taskId,
            accuracy: accuracy,
            timeliness: timeliness,
            reliability: reliability,
            comment: comment,
            timestamp: block.timestamp
        });

        arr.feedbackHistory[agent].push(storedFeedback);
        arr.feedbackExists[feedbackKey] = true;

        // Update reputation
        _updateReputation(agent);

        emit FeedbackSubmitted(
            agent,
            msg.sender,
            taskId,
            accuracy,
            timeliness,
            reliability,
            block.timestamp
        );
    }

    /**
     * @notice Get agent reputation summary
     * @param agent Address of the agent
     * @return reputation Reputation structure with calculated scores
     */
    function getReputation(address agent) external view onlyRegisteredAgent(agent) returns (AgentReputation memory reputation) {
        LibRugStorage.AgentReputationRegistry storage arr = LibRugStorage.agentReputationStorage();
        LibRugStorage.StoredReputation storage stored = arr.reputations[agent];

        reputation = AgentReputation({
            totalTasks: stored.totalTasks,
            totalFeedback: stored.totalFeedback,
            averageAccuracy: stored.totalFeedback > 0 ? stored.totalAccuracy / stored.totalFeedback : 0,
            averageTimeliness: stored.totalFeedback > 0 ? stored.totalTimeliness / stored.totalFeedback : 0,
            averageReliability: stored.totalFeedback > 0 ? stored.totalReliability / stored.totalFeedback : 0,
            reputationScore: stored.reputationScore
        });
    }

    /**
     * @notice Get all feedback for an agent
     * @param agent Address of the agent
     * @return feedback Array of all feedback submissions
     */
    function getFeedbackHistory(address agent) external view onlyRegisteredAgent(agent) returns (Feedback[] memory feedback) {
        LibRugStorage.AgentReputationRegistry storage arr = LibRugStorage.agentReputationStorage();
        LibRugStorage.StoredFeedback[] storage stored = arr.feedbackHistory[agent];
        
        feedback = new Feedback[](stored.length);
        for (uint256 i = 0; i < stored.length; i++) {
            feedback[i] = Feedback({
                client: stored[i].client,
                taskId: stored[i].taskId,
                accuracy: stored[i].accuracy,
                timeliness: stored[i].timeliness,
                reliability: stored[i].reliability,
                comment: stored[i].comment,
                timestamp: stored[i].timestamp
            });
        }
    }

    /**
     * @notice Get feedback count for an agent
     * @param agent Address of the agent
     * @return count Number of feedback submissions
     */
    function getFeedbackCount(address agent) external view returns (uint256 count) {
        LibRugStorage.AgentReputationRegistry storage arr = LibRugStorage.agentReputationStorage();
        return arr.feedbackHistory[agent].length;
    }

    /**
     * @notice Get recent feedback for an agent (last N submissions)
     * @param agent Address of the agent
     * @param count Number of recent feedback to return
     * @return feedback Array of recent feedback submissions
     */
    function getRecentFeedback(address agent, uint256 count) external view onlyRegisteredAgent(agent) returns (Feedback[] memory feedback) {
        LibRugStorage.AgentReputationRegistry storage arr = LibRugStorage.agentReputationStorage();
        uint256 total = arr.feedbackHistory[agent].length;
        
        if (count > total) {
            count = total;
        }

        feedback = new Feedback[](count);
        uint256 startIndex = total - count;
        LibRugStorage.StoredFeedback[] storage stored = arr.feedbackHistory[agent];
        
        for (uint256 i = 0; i < count; i++) {
            LibRugStorage.StoredFeedback storage s = stored[startIndex + i];
            feedback[i] = Feedback({
                client: s.client,
                taskId: s.taskId,
                accuracy: s.accuracy,
                timeliness: s.timeliness,
                reliability: s.reliability,
                comment: s.comment,
                timestamp: s.timestamp
            });
        }
    }

    // ========== INTERNAL FUNCTIONS ==========

    /**
     * @notice Update agent reputation based on all feedback
     * @param agent Address of the agent
     * @dev Recalculates averages and overall reputation score
     */
    function _updateReputation(address agent) internal {
        LibRugStorage.AgentReputationRegistry storage arr = LibRugStorage.agentReputationStorage();
        LibRugStorage.StoredFeedback[] storage feedbacks = arr.feedbackHistory[agent];
        LibRugStorage.StoredReputation storage stored = arr.reputations[agent];

        if (feedbacks.length == 0) {
            stored.reputationScore = 0;
            stored.lastUpdated = block.timestamp;
            return;
        }

        // Calculate totals (scaled to basis points)
        uint256 totalAccuracy = 0;
        uint256 totalTimeliness = 0;
        uint256 totalReliability = 0;

        for (uint256 i = 0; i < feedbacks.length; i++) {
            LibRugStorage.StoredFeedback storage f = feedbacks[i];
            totalAccuracy += uint256(f.accuracy) * BASIS_POINTS;
            totalTimeliness += uint256(f.timeliness) * BASIS_POINTS;
            totalReliability += uint256(f.reliability) * BASIS_POINTS;
        }

        stored.lastUpdated = block.timestamp;

        // Store totals (will be divided by count when retrieved)
        stored.totalAccuracy = totalAccuracy;
        stored.totalTimeliness = totalTimeliness;
        stored.totalReliability = totalReliability;
        stored.totalFeedback = feedbacks.length;

        // Calculate weighted reputation score (0-100)
        // Formula: (average of all three ratings / 5.0) * 100
        // Using basis points: (avg / 500) * 100 = avg / 5
        uint256 avgRating = (totalAccuracy + totalTimeliness + totalReliability) / (feedbacks.length * 3);
        stored.reputationScore = (avgRating * 100) / BASIS_POINTS; // Convert to 0-100 scale

        emit ReputationUpdated(agent, stored.totalFeedback, stored.reputationScore);
    }
}

