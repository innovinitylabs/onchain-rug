// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {LibDiamond} from "../diamond/libraries/LibDiamond.sol";
import {LibTransferSecurity} from "../libraries/LibTransferSecurity.sol";
import {ICreatorToken} from "@limitbreak/creator-token-contracts/interfaces/ICreatorToken.sol";
import {ICreatorTokenTransferValidator} from "@limitbreak/creator-token-contracts/interfaces/ICreatorTokenTransferValidator.sol";
import {TransferSecurityLevels, CollectionSecurityPolicy} from "@limitbreak/creator-token-contracts/utils/TransferPolicy.sol";

/**
 * @title ERC721CFacet
 * @notice ERC-721-C compatible facet for transfer validation and security
 * @dev Handles ERC721-C compliance, transfer validation, and security policies
 */
contract ERC721CFacet is ICreatorToken {

    /// @dev ICreatorToken interface implementation

    /// @notice Get the transfer validator contract address
    function getTransferValidator() external view override returns (ICreatorTokenTransferValidator) {
        return ICreatorTokenTransferValidator(LibTransferSecurity.getTransferValidator());
    }

    /// @notice Get the security policy for this collection
    function getSecurityPolicy() external view override returns (CollectionSecurityPolicy memory) {
        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) {
            return CollectionSecurityPolicy({
                transferSecurityLevel: TransferSecurityLevels.Zero,
                operatorWhitelistId: 0,
                permittedContractReceiversId: 0
            });
        }

        try ICreatorTokenTransferValidator(validator).getCollectionSecurityPolicy(address(this)) returns (CollectionSecurityPolicy memory policy) {
            return policy;
        } catch {
            return CollectionSecurityPolicy({
                transferSecurityLevel: TransferSecurityLevels.Zero,
                operatorWhitelistId: 0,
                permittedContractReceiversId: 0
            });
        }
    }

    /// @notice Get the list of whitelisted operators
    function getWhitelistedOperators() external view override returns (address[] memory) {
        CollectionSecurityPolicy memory policy = this.getSecurityPolicy();
        address validator = LibTransferSecurity.getTransferValidator();

        if (validator == address(0) || policy.operatorWhitelistId == 0) {
            return new address[](0);
        }

        try ICreatorTokenTransferValidator(validator).getWhitelistedOperators(policy.operatorWhitelistId) returns (address[] memory operators) {
            return operators;
        } catch {
            return new address[](0);
        }
    }

    /// @notice Get the list of permitted contract receivers
    function getPermittedContractReceivers() external view override returns (address[] memory) {
        CollectionSecurityPolicy memory policy = this.getSecurityPolicy();
        address validator = LibTransferSecurity.getTransferValidator();

        if (validator == address(0) || policy.permittedContractReceiversId == 0) {
            return new address[](0);
        }

        try ICreatorTokenTransferValidator(validator).getPermittedContractReceivers(policy.permittedContractReceiversId) returns (address[] memory receivers) {
            return receivers;
        } catch {
            return new address[](0);
        }
    }

    /// @notice Check if an operator is whitelisted
    function isOperatorWhitelisted(address operator) external view override returns (bool) {
        address[] memory operators = this.getWhitelistedOperators();
        for (uint256 i = 0; i < operators.length; i++) {
            if (operators[i] == operator) {
                return true;
            }
        }
        return false;
    }

    /// @notice Check if a contract receiver is permitted
    function isContractReceiverPermitted(address receiver) external view override returns (bool) {
        address[] memory receivers = this.getPermittedContractReceivers();
        for (uint256 i = 0; i < receivers.length; i++) {
            if (receivers[i] == receiver) {
                return true;
            }
        }
        return false;
    }

    /// @notice Check if a transfer is allowed
    function isTransferAllowed(address caller, address from, address to) external view override returns (bool) {
        if (!LibTransferSecurity.areTransfersEnforced()) return true;

        address validator = LibTransferSecurity.getTransferValidator();
        if (validator == address(0)) return true;

        try ICreatorTokenTransferValidator(validator).applyCollectionTransferPolicy(caller, from, to) {
            return true;
        } catch {
            return false;
        }
    }

    /// @notice Override ERC721 _beforeTokenTransfer for ERC721-C validation
    /// @dev This function should be called by the main NFT facet's _beforeTokenTransfer
    function validateTransfer(address from, address to, uint256 tokenId) external view {
        // ERC721-C transfer validation - skip for mints (from == address(0)) and burns (to == address(0))
        if (LibTransferSecurity.areTransfersEnforced() && from != address(0) && to != address(0)) {
            address validator = LibTransferSecurity.getTransferValidator();
            if (validator != address(0)) {
                _validateTransfer(from, to, tokenId, validator);
            }
        }
    }

    /// @dev Internal transfer validation with validator contract
    function _validateTransfer(address from, address to, uint256 tokenId, address validator) private view {
        try ICreatorTokenTransferValidator(validator).applyCollectionTransferPolicy(
            msg.sender, from, to
        ) {} catch {
            revert("Transfer validation failed");
        }
    }

    /// @notice Get ERC721-C interface support
    function supportsERC721CInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(ICreatorToken).interfaceId;
    }
}
