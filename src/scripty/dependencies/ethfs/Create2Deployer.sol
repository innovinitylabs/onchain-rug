// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title Create2Deployer
 * @dev Minimal CREATE2 deployer for EthFS compatibility
 */
contract Create2Deployer {
    event Deployed(address indexed addr, bytes32 indexed salt);

    /**
     * @notice Deploy contract using CREATE2
     * @param salt Salt for deterministic deployment
     * @param initCode Contract initialization code
     * @return addr The deployed contract address
     */
    function deploy(bytes32 salt, bytes memory initCode) external returns (address addr) {
        assembly {
            addr := create2(0, add(initCode, 0x20), mload(initCode), salt)
        }
        require(addr != address(0), "Create2Deployer: deployment failed");
        emit Deployed(addr, salt);
        return addr;
    }

    /**
     * @notice Get the deployer address (required by EthFS FileStore)
     * @return The address of this deployer contract
     */
    function deployer() external view returns (address) {
        return address(this);
    }

    /**
     * @notice Compute the address of a contract that would be deployed with the given salt and initCode
     * @param salt Salt for deterministic deployment
     * @param initCode Contract initialization code
     * @return addr The computed contract address
     */
    function computeAddress(bytes32 salt, bytes memory initCode) external view returns (address addr) {
        bytes32 initCodeHash = keccak256(initCode);
        addr = address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            initCodeHash
        )))));
    }
}
