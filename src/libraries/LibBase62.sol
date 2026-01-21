// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title LibBase62
 * @notice Base62 encoding library for short referral codes
 * @dev Alphanumeric encoding: 0-9, A-Z, a-z (62 characters total)
 *
 * Used to generate deterministic short codes from wallet addresses for referral system.
 * Provides ~47 bits of entropy with 8-character codes (62^8 combinations).
 */
library LibBase62 {
    // Base62 alphabet (alphanumeric, case-sensitive)
    string internal constant ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    /**
     * @notice Encode bytes to base62 string
     * @param data Input bytes to encode
     * @param length Desired output length in characters
     * @return Encoded base62 string
     *
     * @dev Uses keccak256 hash of input for deterministic encoding
     *      Takes first 8 bytes (64 bits) of hash for sufficient entropy
     */
    function encode(bytes memory data, uint8 length)
        internal
        pure
        returns (string memory)
    {
        // Require reasonable length limits
        require(length > 0 && length <= 16, "Invalid length");

        // Hash input data for deterministic encoding
        bytes32 hash = keccak256(data);

        // Extract first 8 bytes from hash (big-endian)
        uint64 value = uint64(bytes8(hash));

        // Handle zero case
        if (value == 0) {
            bytes memory zeroResult = new bytes(length);
            for (uint8 i = 0; i < length; i++) {
                zeroResult[i] = bytes1("0");
            }
            return string(zeroResult);
        }

        bytes memory alphabet = bytes(ALPHABET);
        bytes memory result = new bytes(length);

        // Encode from least significant digit
        for (uint8 i = 0; i < length; i++) {
            if (value == 0) {
                // Pad with leading zeros
                result[length - 1 - i] = bytes1("0");
            } else {
                result[length - 1 - i] = alphabet[value % 62];
                value /= 62;
            }
        }

        return string(result);
    }

    /**
     * @notice Generate deterministic referral code from wallet address
     * @param wallet The wallet address to encode
     * @return 8-character base62 string
     *
     * @dev Always produces the same code for the same wallet address
     */
    function generateReferralCode(address wallet)
        internal
        pure
        returns (string memory)
    {
        bytes memory addrBytes = abi.encodePacked(wallet);
        return encode(addrBytes, 8);
    }

    /**
     * @notice Validate if a string contains only valid base62 characters
     * @param str String to validate
     * @return True if string contains only base62 characters
     */
    function isValidBase62(string memory str)
        internal
        pure
        returns (bool)
    {
        bytes memory strBytes = bytes(str);
        bytes memory alphabet = bytes(ALPHABET);

        for (uint256 i = 0; i < strBytes.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < alphabet.length; j++) {
                if (strBytes[i] == alphabet[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return true;
    }
}