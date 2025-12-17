// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {LibRugStorage} from "../libraries/LibRugStorage.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {RugNFTFacet} from "./RugNFTFacet.sol";

/**
 * @title RugMaintenanceFacet
 * @notice FRESH REDESIGN: Simplified maintenance services for OnchainRugs
 * @dev Handles cleaning, restoration, and master restoration with dirt (3 levels) and aging (10 levels)
 */
contract RugMaintenanceFacet {
    // Events
    event RugCleaned(uint256 indexed tokenId, address indexed owner, uint256 cost, bool wasFree);
    event RugRestored(uint256 indexed tokenId, address indexed owner, uint8 previousLevel, uint8 newLevel, uint256 cost);
    event RugMasterRestored(uint256 indexed tokenId, address indexed owner, uint8 previousDirt, uint8 previousAging, uint256 cost);
    event PaymentProcessed(uint256 indexed tokenId, address indexed agent, address indexed owner, uint256 totalCost, uint256 serviceFee, uint256 maintenanceCost);
    event AgentAuthorized(address indexed owner, address indexed agent);
    event AgentRevoked(address indexed owner, address indexed agent);
    event AuthorizationTokenUsed(bytes32 indexed tokenHash, address indexed agent, uint256 tokenId, string action);

    // ========= Agent Authorization (Per-Owner Global Allowlist) =========

    function authorizeMaintenanceAgent(address agent) external {
        require(agent != address(0), "Invalid agent");
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Only add if not already authorized
        if (!rs.isOwnerAgentAllowed[msg.sender][agent]) {
            rs.isOwnerAgentAllowed[msg.sender][agent] = true;
            rs.ownerAuthorizedAgents[msg.sender].push(agent);
            emit AgentAuthorized(msg.sender, agent);
        }
    }

    function revokeMaintenanceAgent(address agent) external {
        require(agent != address(0), "Invalid agent");
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        if (rs.isOwnerAgentAllowed[msg.sender][agent]) {
            rs.isOwnerAgentAllowed[msg.sender][agent] = false;

            // Remove from array
            address[] storage agents = rs.ownerAuthorizedAgents[msg.sender];
            for (uint256 i = 0; i < agents.length; i++) {
                if (agents[i] == agent) {
                    // Move last element to this position and pop
                    agents[i] = agents[agents.length - 1];
                    agents.pop();
                    break;
                }
            }

            emit AgentRevoked(msg.sender, agent);
        }
    }

    /**
     * @notice Get all authorized agents for the caller
     * @return agents Array of authorized agent addresses
     */
    function getAuthorizedAgents() external view returns (address[] memory) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return rs.ownerAuthorizedAgents[msg.sender];
    }

    /**
     * @notice Get all authorized agents for a specific owner
     * @param owner Owner address to check
     * @return agents Array of authorized agent addresses
     */
    function getAuthorizedAgentsFor(address owner) external view returns (address[] memory) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return rs.ownerAuthorizedAgents[owner];
    }

    /**
     * @notice Check if an agent is authorized for the caller
     * @param agent Agent address to check
     * @return isAuthorized True if the agent is authorized
     */
    function isAgentAuthorized(address agent) external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return rs.isOwnerAgentAllowed[msg.sender][agent];
    }

    /**
     * @notice Clean a rug (resets dirt to level 0, earns maintenance points)
     * @param tokenId Token ID to clean
     */
    function cleanRug(uint256 tokenId) external payable {
        // Owner-only direct call
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(owner == msg.sender, "Not token owner");
        (uint256 cost, bool wasFree) = _performClean(tokenId);
        require(msg.value == cost, "Must send exact payment amount");
        emit RugCleaned(tokenId, owner, cost, wasFree);
    }

    /**
     * @notice Restore a rug (reduce aging level by 1, clean dirt)
     * @param tokenId Token ID to restore
     */
    function restoreRug(uint256 tokenId) external payable {
        // Owner-only direct call
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(owner == msg.sender, "Not token owner");
        (uint8 previousAging, uint8 newAging, uint256 cost) = _performRestore(tokenId);
        require(msg.value == cost, "Must send exact payment amount");
        emit RugRestored(tokenId, owner, previousAging, newAging, cost);
    }

    /**
     * @notice Master restore a rug (reset dirt and aging to level 0)
     * @param tokenId Token ID to master restore
     */
    function masterRestoreRug(uint256 tokenId) external payable {
        // Owner-only direct call
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(owner == msg.sender, "Not token owner");
        (uint8 prevDirt, uint8 prevAging, uint256 cost) = _performMasterRestore(tokenId);
        require(msg.value == cost, "Must send exact payment amount");
        emit RugMasterRestored(tokenId, owner, prevDirt, prevAging, cost);
    }

    // ========= Authorization Token Verification =========

    /**
     * @notice Verify and consume an X402 authorization token
     * @param tokenHash Hash of the authorization token
     * @param agent Agent address
     * @param tokenId Token ID
     * @param action Action being performed
     * @param expires Expiration timestamp
     * @param nonce Unique nonce used in token generation
     * @return isValid Whether the token is valid and consumed
     */
    function _verifyAuthorizationToken(
        bytes32 tokenHash,
        address agent,
        uint256 tokenId,
        string memory action,
        uint256 expires,
        string calldata nonce
    ) internal returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Check if token already used (prevent replay attacks)
        require(!rs.usedAuthorizationTokens[tokenHash], "Token already used");
        
        // Check if nonce already used (prevent nonce reuse)
        bytes32 nonceHash = keccak256(abi.encodePacked(nonce));
        require(!rs.usedNonces[nonceHash], "Nonce already used");

        // Check expiration (reduced to 2 minutes - checked in API, but verify here too)
        require(block.timestamp <= expires, "Token expired");
        
        // Check expiration window more carefully to avoid edge cases
        uint256 timeUntilExpiry = expires > block.timestamp ? expires - block.timestamp : 0;
        require(timeUntilExpiry <= 120, "Token expiration too far in future"); // Max 2 minutes

        // Verify agent is authorized for this token's owner
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(rs.isOwnerAgentAllowed[owner][agent], "Agent not authorized for this token");

        // CRYPTOGRAPHIC VERIFICATION: Recreate hash and verify it matches
        bytes32 expectedHash = keccak256(abi.encodePacked(agent, tokenId, action, expires, nonce));
        require(tokenHash == expectedHash, "Invalid token hash - cryptographic verification failed");

        // CEI pattern: Mark token and nonce as used BEFORE any external calls
        rs.usedAuthorizationTokens[tokenHash] = true;
        rs.usedNonces[nonceHash] = true;

        emit AuthorizationTokenUsed(tokenHash, agent, tokenId, action);

        return true;
    }

    /**
     * @notice Check if an authorization token is valid (without consuming it)
     * @param tokenHash Hash of the authorization token
     * @return isValid Whether the token exists and is unused
     */
    function isAuthorizationTokenValid(bytes32 tokenHash) external view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        return !rs.usedAuthorizationTokens[tokenHash];
    }

    // ========= Agent Entry Points (X402 Authorized - Require Token) =========

    function cleanRugAgent(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");

        // Verify caller is authorized agent for this NFT owner
        require(rs.isOwnerAgentAllowed[owner][msg.sender], "Agent not authorized for this owner");

        (uint256 maintenanceCost, bool wasFree) = _performClean(tokenId);

        // Calculate total cost (maintenance + service fee)
        uint256 totalCost = maintenanceCost + rs.serviceFee;

        // Verify payment amount
        require(msg.value >= totalCost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundOk, "Refund failed");
        }

        // Payout service fee to fee recipient
        if (rs.serviceFee > 0) {
            (bool feeOk, ) = payable(rs.feeRecipient).call{value: rs.serviceFee}("");
            require(feeOk, "Service fee payout failed");
        }

        emit PaymentProcessed(tokenId, msg.sender, owner, totalCost, rs.serviceFee, maintenanceCost);
        emit RugCleaned(tokenId, owner, totalCost, wasFree);
    }

    function restoreRugAgent(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");

        // Verify caller is authorized agent for this NFT owner
        require(rs.isOwnerAgentAllowed[owner][msg.sender], "Agent not authorized for this owner");

        (uint8 previousAging, uint8 newAging, uint256 maintenanceCost) = _performRestore(tokenId);

        // Calculate total cost (maintenance + service fee)
        uint256 totalCost = maintenanceCost + rs.serviceFee;

        // Verify payment amount
        require(msg.value >= totalCost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundOk, "Refund failed");
        }

        // Payout service fee to fee recipient
        if (rs.serviceFee > 0) {
            (bool feeOk, ) = payable(rs.feeRecipient).call{value: rs.serviceFee}("");
            require(feeOk, "Service fee payout failed");
        }

        emit PaymentProcessed(tokenId, msg.sender, owner, totalCost, rs.serviceFee, maintenanceCost);
        emit RugRestored(tokenId, owner, previousAging, newAging, totalCost);
    }

    function masterRestoreRugAgent(uint256 tokenId) external payable {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        address owner = IERC721(address(this)).ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");

        // Verify caller is authorized agent for this NFT owner
        require(rs.isOwnerAgentAllowed[owner][msg.sender], "Agent not authorized for this owner");

        (uint8 prevDirt, uint8 prevAging, uint256 maintenanceCost) = _performMasterRestore(tokenId);

        // Calculate total cost (maintenance + service fee)
        uint256 totalCost = maintenanceCost + rs.serviceFee;

        // Verify payment amount
        require(msg.value >= totalCost, "Insufficient payment");

        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            require(refundOk, "Refund failed");
        }

        // Payout service fee to fee recipient
        if (rs.serviceFee > 0) {
            (bool feeOk, ) = payable(rs.feeRecipient).call{value: rs.serviceFee}("");
            require(feeOk, "Service fee payout failed");
        }

        emit PaymentProcessed(tokenId, msg.sender, owner, totalCost, rs.serviceFee, maintenanceCost);
        emit RugMasterRestored(tokenId, owner, prevDirt, prevAging, totalCost);
    }

    /**
     * @notice Get cost for cleaning a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if free or not beneficial)
     */
    function getCleaningCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        // Return 0 if cleaning is not beneficial
        uint8 dirtLevel = _getDirtLevel(tokenId);
        bool isFreeCleaning = _isCleaningFree(tokenId);
        bool needsCleaning = dirtLevel > 0 || isFreeCleaning;

        if (!needsCleaning) return 0;

        return isFreeCleaning ? 0 : rs.cleaningCost;
    }

    /**
     * @notice Get cost for restoring a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if no aging to restore)
     */
    function getRestorationCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        uint8 currentAging = _getAgingLevel(tokenId);
        return currentAging > 0 ? rs.restorationCost : 0;
    }

    /**
     * @notice Get cost for master restoration of a specific rug
     * @param tokenId Token ID to check
     * @return cost Cost in wei (0 if already pristine)
     */
    function getMasterRestorationCost(uint256 tokenId) external view returns (uint256) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();

        // Verify token exists
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentAging = _getAgingLevel(tokenId);
        return (currentDirt > 0 || currentAging > 0) ? rs.masterRestorationCost : 0;
    }

    /**
     * @notice Check if a rug can be cleaned (has dirt or free cleaning available)
     * @param tokenId Token ID to check
     * @return canClean True if cleaning is beneficial
     */
    function canCleanRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        uint8 dirtLevel = _getDirtLevel(tokenId);
        bool isFreeCleaning = _isCleaningFree(tokenId);
        return dirtLevel > 0 || isFreeCleaning;
    }

    /**
     * @notice Check if a rug can be restored (has aging that can be reduced)
     * @param tokenId Token ID to check
     * @return canRestore True if restoration is available
     */
    function canRestoreRug(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        return _getAgingLevel(tokenId) > 0;
    }

    /**
     * @notice Check if a rug needs master restoration
     * @param tokenId Token ID to check
     * @return needsMaster True if any aging exists
     */
    function needsMasterRestoration(uint256 tokenId) external view returns (bool) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");
        uint8 dirt = _getDirtLevel(tokenId);
        uint8 aging = _getAgingLevel(tokenId);
        return dirt > 0 || aging > 0;
    }

    /**
     * @notice Get maintenance options available for a rug
     * @param tokenId Token ID to check
     * @return canClean Whether the rug can be cleaned
     * @return canRestore Whether the rug can be restored
     * @return needsMaster Whether master restoration is needed
     * @return cleaningCost Cost to clean the rug
     * @return restorationCost Cost to restore the rug
     * @return masterCost Cost for master restoration
     */
    function getMaintenanceOptions(uint256 tokenId) external view returns (
        bool canClean,
        bool canRestore,
        bool needsMaster,
        uint256 cleaningCost,
        uint256 restorationCost,
        uint256 masterCost
    ) {
        require(IERC721(address(this)).ownerOf(tokenId) != address(0), "Token does not exist");

        canClean = _getDirtLevel(tokenId) > 0;
        canRestore = _getAgingLevel(tokenId) > 0; // Restoration reduces aging level
        needsMaster = canClean || canRestore;

        cleaningCost = canClean ? (_isCleaningFree(tokenId) ? 0 : LibRugStorage.rugStorage().cleaningCost) : 0;
        restorationCost = canRestore ? LibRugStorage.rugStorage().restorationCost : 0;
        masterCost = needsMaster ? LibRugStorage.rugStorage().masterRestorationCost : 0;
    }

    // Internal helper functions

    function _payoutServiceFee(uint256 serviceFee) internal {
        if (serviceFee == 0) return;
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        require(rs.feeRecipient != address(0), "Fee recipient not set");
        (bool ok, ) = payable(rs.feeRecipient).call{value: serviceFee}("");
        require(ok, "Fee transfer failed");
    }

    function _performClean(uint256 tokenId) internal returns (uint256 cost, bool wasFree) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentDirt = _getDirtLevel(tokenId);
        bool isFree = _isCleaningFree(tokenId);
        bool needsCleaning = currentDirt > 0 || isFree;
        require(needsCleaning, "Rug doesn't need cleaning right now");

        uint256 maintenanceCost = isFree ? 0 : rs.cleaningCost;

        uint8 currentAging = _getAgingLevel(tokenId);
        aging.agingLevel = currentAging;
        aging.lastCleaned = block.timestamp;
        aging.cleaningCount++;

        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            uint8 oldFrameLevel = aging.frameLevel;
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
            LibRugStorage.updateDiamondFrameCount(tokenId, oldFrameLevel, newFrameLevel);
        }
        return (maintenanceCost, isFree);
    }

    function _performRestore(uint256 tokenId) internal returns (uint8 previousAging, uint8 newAging, uint256 cost) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentAging = _getAgingLevel(tokenId);
        require(currentAging > 0, "Rug has no aging to restore");

        uint8 prev = currentAging;
        aging.lastCleaned = block.timestamp;
        aging.agingLevel = currentAging > 0 ? currentAging - 1 : 0;
        aging.restorationCount++;

        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            uint8 oldFrameLevel = aging.frameLevel;
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
            LibRugStorage.updateDiamondFrameCount(tokenId, oldFrameLevel, newFrameLevel);
        }
        return (prev, aging.agingLevel, rs.restorationCost);
    }

    function _performMasterRestore(uint256 tokenId) internal returns (uint8 previousDirt, uint8 previousAging, uint256 cost) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint8 currentDirt = _getDirtLevel(tokenId);
        uint8 currentAging = _getAgingLevel(tokenId);
        require(currentDirt > 0 || currentAging > 0, "Rug is already pristine");

        uint8 prevDirt = currentDirt;
        uint8 prevAging = currentAging;
        aging.lastCleaned = block.timestamp;
        aging.agingLevel = 0;
        aging.masterRestorationCount++;

        uint256 newScore = LibRugStorage.calculateMaintenanceScore(aging);
        uint8 newFrameLevel = LibRugStorage.getFrameLevelFromScore(newScore);
        if (newFrameLevel != aging.frameLevel) {
            uint8 oldFrameLevel = aging.frameLevel;
            aging.frameLevel = newFrameLevel;
            aging.frameAchievedTime = block.timestamp;
            LibRugStorage.updateDiamondFrameCount(tokenId, oldFrameLevel, newFrameLevel);
        }
        return (prevDirt, prevAging, rs.masterRestorationCost);
    }

    function _getDirtLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Gold+ frames never get dirty
        if (aging.frameLevel >= 3) {
            return 0;
        }

        // Calculate dirt level based on time since cleaning with frame speed adjustments
        uint256 timeSinceCleaned = block.timestamp - aging.lastCleaned;

        // Pre-calculate adjusted thresholds to reduce computation
        uint256 level1Threshold;
        uint256 level2Threshold;

        if (aging.frameLevel == 2) {
            // Silver: 2x slower
            level1Threshold = rs.dirtLevel1Days * 2;
            level2Threshold = rs.dirtLevel2Days * 2;
        } else if (aging.frameLevel == 1) {
            // Bronze: 1.5x slower (multiply by 3/2)
            level1Threshold = (rs.dirtLevel1Days * 3) / 2;
            level2Threshold = (rs.dirtLevel2Days * 3) / 2;
        } else {
            // None: normal speed
            level1Threshold = rs.dirtLevel1Days;
            level2Threshold = rs.dirtLevel2Days;
        }

        if (timeSinceCleaned >= level2Threshold) return 2;
        if (timeSinceCleaned >= level1Threshold) return 1;
        return 0;
    }

    function _getAgingLevel(uint256 tokenId) internal view returns (uint8) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        uint256 timeSinceLevelStart = block.timestamp - aging.lastCleaned;
        uint256 baseInterval = rs.agingAdvanceDays;

        // Apply frame-based aging immunity (higher frames age slower)
        uint256 agingMultiplier = LibRugStorage.getAgingMultiplier(aging.frameLevel);
        uint256 adjustedInterval = (baseInterval * 100) / agingMultiplier;

        // Calculate how many levels we should have advanced
        uint8 levelsAdvanced = uint8(timeSinceLevelStart / adjustedInterval);

        // Cap at max level 10
        uint8 calculatedLevel = aging.agingLevel + levelsAdvanced;
        return calculatedLevel > 10 ? 10 : calculatedLevel;
    }

    function _isCleaningFree(uint256 tokenId) internal view returns (bool) {
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        LibRugStorage.RugData storage rug = rs.rugs[tokenId];
        LibRugStorage.AgingData storage aging = rs.agingData[tokenId];

        // Free if within initial grace period from mint
        uint256 timeSinceMint = block.timestamp - rug.mintTime;
        if (timeSinceMint <= rs.freeCleanDays) return true;

        // Free if recently cleaned (within free window)
        uint256 timeSinceLastClean = block.timestamp - aging.lastCleaned;
        if (timeSinceLastClean <= rs.freeCleanWindow) return true;

        return false;
    }

    /**
     * @notice Get maintenance history for a rug (moved from RugNFTFacet)
     * @param tokenId Token ID
     * @return cleaningCount Number of times cleaned
     * @return restorationCount Number of times restored
     * @return masterRestorationCount Number of master restorations
     * @return launderingCount Number of times laundered
     * @return maintenanceScore Calculated maintenance score
     * @return lastLaundered Timestamp of last laundering
     */
    function getMaintenanceHistory(uint256 tokenId) external view returns (
        uint256 cleaningCount,
        uint256 restorationCount,
        uint256 masterRestorationCount,
        uint256 launderingCount,
        uint256 maintenanceScore,
        uint256 lastLaundered
    ) {
        // Check token exists using diamond call
        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodeWithSignature("ownerOf(uint256)", tokenId)
        );
        require(success && data.length == 32, "Token does not exist");
        address owner = abi.decode(data, (address));
        require(owner != address(0), "Token does not exist");
        LibRugStorage.AgingData storage aging = LibRugStorage.rugStorage().agingData[tokenId];

        return (
            aging.cleaningCount,
            aging.restorationCount,
            aging.masterRestorationCount,
            aging.launderingCount,
            LibRugStorage.calculateMaintenanceScore(aging),
            aging.lastLaundered
        );
    }
}
