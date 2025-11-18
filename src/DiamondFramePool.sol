// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DiamondFramePool
 * @notice Separate contract for diamond frame royalty pool
 * @dev Uses magnified per-share system to ensure fair distribution over time
 * @dev Each NFT gets equal share regardless of when they claim
 */
contract DiamondFramePool is ReentrancyGuard {
    // Events
    event PoolDeposit(address indexed depositor, uint256 amount, uint256 totalDiamondFrames);
    event Claim(address indexed claimant, uint256[] tokenIds, uint256 amount);
    event MinimumClaimableAmountSet(uint256 newAmount);
    event RoyaltyDistributed(uint256 amount, uint256 totalDiamondFrames);

    // Constants
    uint256 constant MAGNITUDE = 2**128; // Magnification factor for precision

    // State
    address public immutable diamondContract; // Diamond contract address
    uint256 public minimumClaimableAmount; // Minimum amount required to claim (in wei)
    
    // Magnified per-share system for fair distribution over time
    uint256 public magnifiedRoyaltyPerNFT; // Cumulative magnified royalty per NFT (increases with deposits)
    mapping(uint256 => uint256) public withdrawnRoyalties; // tokenId => total amount withdrawn
    uint256 public totalRoyaltiesDeposited; // Total amount ever deposited (for tracking)
    uint256 public accumulatedRoyaltiesBeforeFirstFrame; // Royalties deposited before any diamond frames existed

    /**
     * @notice Constructor
     * @param _diamondContract Address of the diamond contract
     * @param _minimumClaimableAmount Minimum claimable amount in wei (e.g., 0.001 ETH = 1000000000000000)
     */
    constructor(address _diamondContract, uint256 _minimumClaimableAmount) {
        require(_diamondContract != address(0), "Invalid diamond contract");
        diamondContract = _diamondContract;
        minimumClaimableAmount = _minimumClaimableAmount;
    }

    /**
     * @notice Receive ETH from any source (diamond contract or others)
     * @dev Updates magnified per-share when royalties are deposited
     */
    receive() external payable nonReentrant {
        if (msg.value > 0) {
            _distributeRoyalties(msg.value);
            emit PoolDeposit(msg.sender, msg.value, _getTotalDiamondFrames());
        }
    }

    /**
     * @notice Internal function to distribute royalties using magnified per-share system
     * @param amount Amount of ETH deposited
     */
    function _distributeRoyalties(uint256 amount) internal {
        uint256 totalDiamondFrames = _getTotalDiamondFrames();
        totalRoyaltiesDeposited += amount;
        
        if (totalDiamondFrames == 0) {
            // No diamond frames exist yet, accumulate royalties
            // When diamond frames appear, accumulated royalties will be distributed proportionally
            accumulatedRoyaltiesBeforeFirstFrame += amount;
            return;
        }

        // If there are accumulated royalties and diamond frames now exist, distribute them first
        if (accumulatedRoyaltiesBeforeFirstFrame > 0) {
            // Distribute accumulated royalties proportionally to all diamond frame NFTs
            magnifiedRoyaltyPerNFT += (accumulatedRoyaltiesBeforeFirstFrame * MAGNITUDE) / totalDiamondFrames;
            accumulatedRoyaltiesBeforeFirstFrame = 0;
        }

        // Update magnified royalty per NFT with new deposit
        // Formula: magnifiedRoyaltyPerNFT += (amount * MAGNITUDE) / totalDiamondFrames
        // This ensures each NFT gets equal share regardless of when they claim
        magnifiedRoyaltyPerNFT += (amount * MAGNITUDE) / totalDiamondFrames;
        
        emit RoyaltyDistributed(amount, totalDiamondFrames);
    }

    /**
     * @notice Get total diamond frame count from diamond contract (internal)
     * @return count Total number of diamond frame NFTs
     */
    function _getTotalDiamondFrames() internal view returns (uint256) {
        (bool success, bytes memory data) = diamondContract.staticcall(
            abi.encodeWithSignature("getDiamondFrameCount()")
        );
        if (!success || data.length != 32) return 0;
        return abi.decode(data, (uint256));
    }

    /**
     * @notice Modifier to ensure only diamond contract can call certain functions
     */
    modifier onlyDiamond() {
        require(msg.sender == diamondContract, "Only diamond contract");
        _;
    }

    /**
     * @notice Claim royalties for tokens (called by diamond contract after verification)
     * @param user Address to pay
     * @param tokenIds Array of valid token IDs (already verified by diamond)
     */
    function claimForTokens(address user, uint256[] calldata tokenIds) external onlyDiamond nonReentrant {
        require(tokenIds.length > 0, "No token IDs provided");
        require(tokenIds.length <= 100, "Too many tokens"); // Prevent DoS - check this first
        require(user != address(0), "Invalid user address");

        // Calculate total claimable amount using magnified per-share system
        uint256 totalClaimableAmount = _calculateClaimableAmount(tokenIds);

        require(totalClaimableAmount >= minimumClaimableAmount, "Claimable amount below minimum");
        require(totalClaimableAmount <= address(this).balance, "Insufficient pool balance");

        // Update withdrawn amounts BEFORE transfer (Checks-Effects-Interactions)
        _updateWithdrawnAmounts(tokenIds, totalClaimableAmount);

        // Transfer to user with gas limit for additional safety
        (bool transferSuccess, ) = payable(user).call{value: totalClaimableAmount, gas: 2300}("");
        require(transferSuccess, "Transfer failed");

        emit Claim(user, tokenIds, totalClaimableAmount);
    }


    /**
     * @notice Internal function to calculate claimable amount for tokens
     * @param tokenIds Array of token IDs to calculate for
     * @return totalClaimable Total claimable amount in wei
     */
    function _calculateClaimableAmount(uint256[] memory tokenIds) internal view returns (uint256) {
        uint256 totalClaimableAmount = 0;
        
        // Calculate claimable for all tokens using magnified per-share system
        // Accumulated royalties are distributed proportionally when first diamond frames appear
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Calculate claimable for this token using magnified per-share system
            uint256 magnifiedWithdrawn = withdrawnRoyalties[tokenId] * MAGNITUDE;
            uint256 magnifiedClaimable = magnifiedRoyaltyPerNFT;
            
            // If this token has withdrawn before, subtract what they've already claimed
            if (magnifiedWithdrawn < magnifiedClaimable) {
                uint256 tokenClaimable = (magnifiedClaimable - magnifiedWithdrawn) / MAGNITUDE;
                totalClaimableAmount += tokenClaimable;
            }
        }
        
        return totalClaimableAmount;
    }

    /**
     * @notice Internal function to update withdrawn amounts for tokens
     * @param tokenIds Array of token IDs to update
     * @param totalAmount Total amount being claimed (for validation)
     */
    function _updateWithdrawnAmounts(uint256[] memory tokenIds, uint256 totalAmount) internal {
        // Update withdrawn amounts for each token based on their individual claimable amounts
        // Accumulated royalties are already distributed proportionally in _distributeRoyalties()
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            uint256 magnifiedWithdrawn = withdrawnRoyalties[tokenId] * MAGNITUDE;
            
            if (magnifiedWithdrawn < magnifiedRoyaltyPerNFT) {
                uint256 tokenClaimable = (magnifiedRoyaltyPerNFT - magnifiedWithdrawn) / MAGNITUDE;
                withdrawnRoyalties[tokenId] += tokenClaimable;
            }
        }
    }

    /**
     * @notice Get pool balance
     * @return balance Current pool balance in wei
     */
    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get claimable amount for a user based on their diamond frame NFTs
     * @param user Address to check
     * @param tokenIds Array of token IDs to check (must be owned by user and have diamond frames)
     * @return claimableAmount Amount user can claim in wei
     */
    function getClaimableAmount(address user, uint256[] calldata tokenIds) external view returns (uint256) {
        if (tokenIds.length == 0) return 0;

        uint256 totalClaimable = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Check ownership
            try IERC721(diamondContract).ownerOf(tokenId) returns (address owner) {
                if (owner != user) continue;
            } catch {
                continue;
            }
            
            // Check diamond frame
            (bool checkSuccess, bytes memory checkData) = diamondContract.staticcall(
                abi.encodeWithSignature("hasDiamondFrame(uint256)", tokenId)
            );
            if (!checkSuccess || checkData.length != 32) continue;
            bool hasDiamondFrame = abi.decode(checkData, (bool));
            if (!hasDiamondFrame) continue;
            
            // Calculate claimable for this token using magnified per-share system
            uint256 magnifiedWithdrawn = withdrawnRoyalties[tokenId] * MAGNITUDE;
            if (magnifiedWithdrawn < magnifiedRoyaltyPerNFT) {
                uint256 tokenClaimable = (magnifiedRoyaltyPerNFT - magnifiedWithdrawn) / MAGNITUDE;
                totalClaimable += tokenClaimable;
            }
        }

        return totalClaimable;
    }

    /**
     * @notice Get claimable amount for a specific token ID
     * @param tokenId Token ID to check
     * @return claimableAmount Amount claimable for this token in wei
     */
    function getClaimableAmountForToken(uint256 tokenId) external view returns (uint256) {
        // Verify token has diamond frame
        (bool checkSuccess, bytes memory checkData) = diamondContract.staticcall(
            abi.encodeWithSignature("hasDiamondFrame(uint256)", tokenId)
        );
        if (!checkSuccess || checkData.length != 32) return 0;
        bool hasDiamondFrame = abi.decode(checkData, (bool));
        if (!hasDiamondFrame) return 0;

        // Calculate claimable using magnified per-share system
        uint256 magnifiedWithdrawn = withdrawnRoyalties[tokenId] * MAGNITUDE;
        if (magnifiedWithdrawn >= magnifiedRoyaltyPerNFT) return 0;
        
        return (magnifiedRoyaltyPerNFT - magnifiedWithdrawn) / MAGNITUDE;
    }

    /**
     * @notice Get total diamond frame NFT count
     * @return count Total number of diamond frame NFTs
     */
    function getTotalDiamondFrameNFTs() external view returns (uint256) {
        return _getTotalDiamondFrames();
    }

    /**
     * @notice Get magnified royalty per NFT (for debugging)
     * @return magnifiedPerNFT Current magnified royalty per NFT
     */
    function getMagnifiedRoyaltyPerNFT() external view returns (uint256) {
        return magnifiedRoyaltyPerNFT;
    }

    /**
     * @notice Get withdrawn amount for a specific token
     * @param tokenId Token ID to check
     * @return withdrawn Total amount withdrawn for this token
     */
    function getWithdrawnForToken(uint256 tokenId) external view returns (uint256) {
        return withdrawnRoyalties[tokenId];
    }

    /**
     * @notice Get all diamond frame token IDs (from diamond contract)
     * @return tokenIds Array of all token IDs with diamond frames
     */
    function getDiamondFrameTokenIds() external view returns (uint256[] memory) {
        (bool success, bytes memory data) = diamondContract.staticcall(
            abi.encodeWithSignature("getDiamondFrameTokenIds()")
        );
        if (!success) return new uint256[](0);
        return abi.decode(data, (uint256[]));
    }
}

