// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title LibERC8021
 * @notice Library for parsing ERC-8021 attribution data from transaction calldata
 * @dev ERC-8021 appends structured data suffixes to transaction calldata for attribution
 * 
 * Suffix Structure:
 * [Schema Data (variable)] + [Schema ID (1 byte)] + [ERC Marker (16 bytes)]
 * 
 * ERC Marker: 0x80218021802180218021802180218021
 * 
 * Schema 0 (Canonical):
 * [codesLength (1 byte)] + [codes (ASCII, comma-delimited)]
 */
library LibERC8021 {
    // ERC-8021 marker (16 bytes) - repeating pattern 0x8021802180218021
    bytes32 public constant ERC8021_MARKER = hex"80218021802180218021802180218021";

    // Minimum calldata size to contain ERC-8021 suffix
    // Marker (16 bytes) + Schema ID (1 byte) + minimum schema data (1 byte) = 18 bytes
    uint256 public constant MIN_SUFFIX_SIZE = 18;

    // Schema IDs
    uint8 public constant SCHEMA_0_CANONICAL = 0;

    /**
     * @notice Attribution data structure
     */
    struct AttributionData {
        bool hasAttribution;
        uint8 schemaId;
        string[] codes;
    }

    /**
     * @notice Parse ERC-8021 attribution data from transaction calldata
     * @param data Full transaction calldata
     * @return AttributionData Parsed attribution information
     * 
     * @dev Works backwards from end of calldata:
     * 1. Extract last 16 bytes (ERC marker)
     * 2. Verify marker matches ERC-8021 marker
     * 3. Extract schema ID (1 byte before marker)
     * 4. Parse schema data based on schema ID
     */
    function parseAttribution(bytes calldata data) 
        internal 
        pure 
        returns (AttributionData memory) 
    {
        AttributionData memory attribution;
        
        // Check if calldata is large enough to contain ERC-8021 suffix
        if (data.length < MIN_SUFFIX_SIZE) {
            return attribution; // No attribution, return empty
        }

        // Extract last 16 bytes (ERC marker)
        bytes32 marker = extractLast16Bytes(data);
        
        // Verify marker matches ERC-8021 marker
        if (marker != ERC8021_MARKER) {
            return attribution; // No valid attribution found
        }

        // Extract schema ID (1 byte before marker)
        uint8 schemaId = uint8(data[data.length - 17]);

        // Parse based on schema ID
        if (schemaId == SCHEMA_0_CANONICAL) {
            return parseSchema0(data);
        }

        // Unknown schema ID - return empty attribution
        return attribution;
    }

    /**
     * @notice Parse Schema 0 (Canonical) attribution
     * @param data Full transaction calldata
     * @return AttributionData Parsed attribution with codes
     * 
     * Schema 0 Format:
     * [codesLength (1 byte)] + [codes (ASCII, comma-delimited)] + [Schema ID (0)] + [Marker]
     */
    function parseSchema0(bytes calldata data) 
        internal 
        pure 
        returns (AttributionData memory) 
    {
        AttributionData memory attribution;
        attribution.hasAttribution = true;
        attribution.schemaId = SCHEMA_0_CANONICAL;

        // Schema data starts at: data.length - 18 (before schema ID + marker)
        // codesLength is the first byte of schema data
        uint256 schemaDataStart = data.length - 18;
        
        if (schemaDataStart == 0) {
            // No schema data, only marker and schema ID
            return attribution;
        }

        uint8 codesLength = uint8(data[schemaDataStart]);
        
        if (codesLength == 0) {
            return attribution; // Empty codes
        }

        // Extract codes bytes (codesLength bytes after codesLength byte)
        bytes memory codesBytes = data[schemaDataStart + 1: schemaDataStart + 1 + codesLength];
        
        // Parse comma-delimited codes
        attribution.codes = parseCommaDelimitedCodes(codesBytes);

        return attribution;
    }

    /**
     * @notice Parse comma-delimited codes from bytes
     * @param codesBytes ASCII bytes containing comma-delimited codes
     * @return string[] Array of parsed codes
     * 
     * Example: "baseapp,morpho" -> ["baseapp", "morpho"]
     */
    function parseCommaDelimitedCodes(bytes memory codesBytes) 
        internal 
        pure 
        returns (string[] memory) 
    {
        // Count commas to determine array size
        uint256 codeCount = 1; // At least one code
        for (uint256 i = 0; i < codesBytes.length; i++) {
            if (codesBytes[i] == 0x2C) { // Comma delimiter
                codeCount++;
            }
        }

        // Allocate array
        string[] memory codes = new string[](codeCount);
        
        if (codeCount == 1) {
            // Single code, no commas
            codes[0] = string(codesBytes);
            return codes;
        }

        // Parse multiple codes
        uint256 currentIndex = 0;
        uint256 startIndex = 0;
        
        for (uint256 i = 0; i < codesBytes.length; i++) {
            if (codesBytes[i] == 0x2C) { // Comma found
                // Extract code from startIndex to i
                bytes memory codeBytes = new bytes(i - startIndex);
                for (uint256 j = startIndex; j < i; j++) {
                    codeBytes[j - startIndex] = codesBytes[j];
                }
                codes[currentIndex] = string(codeBytes);
                currentIndex++;
                startIndex = i + 1;
            }
        }
        
        // Add last code (after final comma)
        bytes memory lastCodeBytes = new bytes(codesBytes.length - startIndex);
        for (uint256 j = startIndex; j < codesBytes.length; j++) {
            lastCodeBytes[j - startIndex] = codesBytes[j];
        }
        codes[currentIndex] = string(lastCodeBytes);

        return codes;
    }

    /**
     * @notice Extract last 16 bytes from calldata (helper function)
     * @param data Full transaction calldata
     * @return bytes32 Last 16 bytes (ERC marker)
     * @dev This function is kept for backwards compatibility but the extraction
     *      is now done inline in parseAttribution for efficiency
     */
    function extractLast16Bytes(bytes calldata data) 
        internal 
        pure 
        returns (bytes32) 
    {
        require(data.length >= 16, "Calldata too short");
        
        // Convert calldata to memory and extract last 16 bytes
        bytes memory dataBytes = data;
        bytes32 marker;
        assembly {
            let offset := sub(mload(dataBytes), 16)
            marker := mload(add(add(dataBytes, 32), offset))
        }
        return marker;
    }

    /**
     * @notice Verify if bytes contain valid ERC-8021 marker
     * @param suffix Suffix bytes to check
     * @return bool True if marker is valid
     */
    function verifyERC8021Marker(bytes memory suffix) 
        internal 
        pure 
        returns (bool) 
    {
        if (suffix.length < 16) {
            return false;
        }

        // Extract last 16 bytes
        bytes32 marker;
        uint256 offset = suffix.length - 16;
        assembly {
            // suffix is a memory pointer, first 32 bytes is length
            // data starts at offset 32, so add 32 + offset to get to last 16 bytes
            marker := mload(add(add(suffix, 32), offset))
        }

        return marker == ERC8021_MARKER;
    }

    /**
     * @notice Extract ERC-8021 suffix from calldata (for testing/debugging)
     * @param data Full transaction calldata
     * @return bytes Suffix bytes (schema data + schema ID + marker)
     */
    function extractERC8021Suffix(bytes calldata data) 
        internal 
        pure 
        returns (bytes memory) 
    {
        if (data.length < MIN_SUFFIX_SIZE) {
            return new bytes(0);
        }

        // Find where suffix starts by checking for marker
        bytes32 marker = extractLast16Bytes(data);
        
        if (marker != ERC8021_MARKER) {
            return new bytes(0); // No valid suffix
        }

        // Extract suffix: everything from schema data start to end
        // We need to find the start by parsing backwards
        // For now, return empty if we can't determine start
        // This is mainly for debugging - parseAttribution() is the main function
        return new bytes(0);
    }
}

