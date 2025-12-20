// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {LibERC8021} from "../src/libraries/LibERC8021.sol";

/**
 * @title LibERC8021Test
 * @notice Comprehensive tests for ERC-8021 attribution parsing library
 */
contract LibERC8021Test is Test {
    
    // ERC-8021 marker constant
    bytes32 constant ERC8021_MARKER = hex"80218021802180218021802180218021";
    
    /**
     * @notice Helper to create ERC-8021 suffix
     * @param codes Comma-delimited codes string (e.g., "baseapp,morpho")
     * @return bytes Complete ERC-8021 suffix
     */
    function createERC8021Suffix(string memory codes) internal pure returns (bytes memory) {
        bytes memory codesBytes = bytes(codes);
        uint8 codesLength = uint8(codesBytes.length);
        
        // Schema 0 format: [codesLength] + [codes] + [schemaId] + [marker]
        bytes memory suffix = new bytes(1 + codesLength + 1 + 16);
        
        // Set codesLength
        suffix[0] = bytes1(codesLength);
        
        // Copy codes
        for (uint256 i = 0; i < codesLength; i++) {
            suffix[1 + i] = codesBytes[i];
        }
        
        // Set schema ID (0)
        suffix[1 + codesLength] = 0x00;
        
        // Set marker (last 16 bytes)
        bytes32 marker = ERC8021_MARKER;
        assembly {
            mstore(add(add(suffix, 0x20), add(codesLength, 2)), marker)
        }
        
        return suffix;
    }
    
    /**
     * @notice Helper to create full calldata with ERC-8021 suffix
     * @param functionData Original function call data
     * @param codes Attribution codes
     * @return bytes Complete calldata with suffix
     */
    function createCalldataWithSuffix(bytes memory functionData, string memory codes) 
        internal 
        pure 
        returns (bytes memory) 
    {
        bytes memory suffix = createERC8021Suffix(codes);
        return abi.encodePacked(functionData, suffix);
    }
    
    // ========== Tests ==========
    
    /**
     * @notice Test parsing valid ERC-8021 suffix with single code
     */
    function test_ParseValidSingleCode() public {
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123)),
            "baseapp"
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.schemaId, 0, "Schema ID should be 0");
        assertEq(result.codes.length, 1, "Should have 1 code");
        assertEq(result.codes[0], "baseapp", "Code should match");
    }
    
    /**
     * @notice Test parsing valid ERC-8021 suffix with multiple codes
     */
    function test_ParseValidMultipleCodes() public {
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("buyRug(uint256)", uint256(1)),
            "baseapp,morpho"
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.schemaId, 0, "Schema ID should be 0");
        assertEq(result.codes.length, 2, "Should have 2 codes");
        assertEq(result.codes[0], "baseapp", "First code should match");
        assertEq(result.codes[1], "morpho", "Second code should match");
    }
    
    /**
     * @notice Test parsing three codes
     */
    function test_ParseValidThreeCodes() public {
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("cleanRug(uint256)", uint256(1)),
            "baseapp,morpho,opensea"
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.codes.length, 3, "Should have 3 codes");
        assertEq(result.codes[0], "baseapp", "First code should match");
        assertEq(result.codes[1], "morpho", "Second code should match");
        assertEq(result.codes[2], "opensea", "Third code should match");
    }
    
    /**
     * @notice Test parsing calldata without ERC-8021 suffix
     */
    function test_ParseNoSuffix() public {
        bytes memory callData = abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123));
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertFalse(result.hasAttribution, "Should not have attribution");
        assertEq(result.codes.length, 0, "Should have no codes");
    }
    
    /**
     * @notice Test parsing with invalid marker
     */
    function test_ParseInvalidMarker() public {
        bytes memory functionData = abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123));
        bytes memory invalidSuffix = abi.encodePacked(uint8(7), "baseapp", uint8(0), bytes32(0x0000000000000000000000000000000000000000000000000000000000000000));
        bytes memory callData = abi.encodePacked(functionData, invalidSuffix);
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertFalse(result.hasAttribution, "Should not have attribution with invalid marker");
    }
    
    /**
     * @notice Test parsing with calldata too short
     */
    function test_ParseTooShort() public {
        bytes memory callData = abi.encodeWithSignature("mint()");
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertFalse(result.hasAttribution, "Should not have attribution for short calldata");
    }
    
    /**
     * @notice Test parsing with empty codes
     */
    function test_ParseEmptyCodes() public {
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123)),
            ""  // Empty codes
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.codes.length, 1, "Should have 1 code (empty string)");
        assertEq(result.codes[0], "", "Code should be empty string");
    }
    
    /**
     * @notice Test parsing with single character code
     */
    function test_ParseSingleCharCode() public {
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123)),
            "a"
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.codes.length, 1, "Should have 1 code");
        assertEq(result.codes[0], "a", "Code should match");
    }
    
    /**
     * @notice Test parsing with long code
     */
    function test_ParseLongCode() public {
        string memory longCode = "this-is-a-very-long-entity-code-name-that-should-still-work";
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123)),
            longCode
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.codes.length, 1, "Should have 1 code");
        assertEq(result.codes[0], longCode, "Long code should match");
    }
    
    /**
     * @notice Test parsing with codes containing numbers
     */
    function test_ParseCodeWithNumbers() public {
        bytes memory callData = createCalldataWithSuffix(
            abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123)),
            "app123,service456"
        );
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should have attribution");
        assertEq(result.codes.length, 2, "Should have 2 codes");
        assertEq(result.codes[0], "app123", "First code with numbers should match");
        assertEq(result.codes[1], "service456", "Second code with numbers should match");
    }
    
    /**
     * @notice Test marker verification
     */
    function test_VerifyMarker() public {
        bytes memory suffix = createERC8021Suffix("test");
        
        bool isValid = LibERC8021.verifyERC8021Marker(suffix);
        assertTrue(isValid, "Valid marker should be verified");
    }
    
    /**
     * @notice Test marker verification with invalid marker
     */
    function test_VerifyInvalidMarker() public {
        bytes memory invalidSuffix = abi.encodePacked(uint8(4), "test", uint8(0), bytes32(0x0000000000000000000000000000000000000000000000000000000000000000));
        
        bool isValid = LibERC8021.verifyERC8021Marker(invalidSuffix);
        assertFalse(isValid, "Invalid marker should not be verified");
    }
    
    /**
     * @notice Test marker verification with too short suffix
     */
    function test_VerifyTooShortSuffix() public {
        bytes memory shortSuffix = "short";
        
        bool isValid = LibERC8021.verifyERC8021Marker(shortSuffix);
        assertFalse(isValid, "Too short suffix should not be verified");
    }
    
    /**
     * @notice Test parsing with schema ID other than 0 (should return empty)
     */
    function test_ParseUnknownSchema() public {
        bytes memory functionData = abi.encodeWithSignature("mintRug(string[],uint256)", new string[](1), uint256(123));
        bytes memory codesBytes = bytes("baseapp");
        uint8 codesLength = uint8(codesBytes.length);
        
        // Create suffix with schema ID = 1 (unknown)
        bytes memory suffix = new bytes(1 + codesLength + 1 + 16);
        suffix[0] = bytes1(codesLength);
        for (uint256 i = 0; i < codesLength; i++) {
            suffix[1 + i] = codesBytes[i];
        }
        suffix[1 + codesLength] = 0x01; // Schema ID = 1 (unknown)
        bytes32 marker = ERC8021_MARKER;
        assembly {
            mstore(add(add(suffix, 0x20), add(codesLength, 2)), marker)
        }
        
        bytes memory callData = abi.encodePacked(functionData, suffix);
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        // Unknown schema should return empty attribution (hasAttribution = false)
        assertFalse(result.hasAttribution, "Unknown schema should not have attribution");
    }
    
    /**
     * @notice Test parsing edge case: codesLength exceeds actual data
     */
    function test_ParseCodesLengthMismatch() public {
        // This test ensures the parser handles edge cases gracefully
        // If codesLength says there are more bytes than available, it should handle it
        
        bytes memory functionData = abi.encodeWithSignature("mint()");
        bytes memory suffix = new bytes(18); // Minimum size
        suffix[0] = 0xFF; // codesLength = 255 (too large)
        suffix[1] = 0x00; // Schema ID
        bytes32 marker = ERC8021_MARKER;
        assembly {
            mstore(add(add(suffix, 0x20), 2), marker)
        }
        
        bytes memory callData = abi.encodePacked(functionData, suffix);
        
        // Should not revert, but may return empty or partial attribution
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        // The parser should handle this gracefully (may have empty codes or skip)
        // Main thing is it shouldn't revert
        assertTrue(true, "Should not revert on codesLength mismatch");
    }
    
    /**
     * @notice Test real-world scenario: mint with attribution
     */
    function test_RealWorldMintWithAttribution() public {
        string[] memory textRows = new string[](1);
        textRows[0] = "Hello";
        
        bytes memory functionData = abi.encodeWithSignature(
            "mintRug(string[],uint256,tuple,tuple,uint256)",
            textRows,
            uint256(123),
            // ... other params would go here in real scenario
            uint256(10)
        );
        
        bytes memory callData = createCalldataWithSuffix(functionData, "baseapp");
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should parse real-world mint attribution");
        assertEq(result.codes[0], "baseapp", "Should extract baseapp code");
    }
    
    /**
     * @notice Test real-world scenario: purchase with multiple attribution sources
     */
    function test_RealWorldPurchaseWithMultipleAttribution() public {
        bytes memory functionData = abi.encodeWithSignature("buyRug(uint256)", uint256(42));
        bytes memory callData = createCalldataWithSuffix(functionData, "blur,opensea,rainbow");
        
        LibERC8021.AttributionData memory result = LibERC8021.parseAttribution(callData);
        
        assertTrue(result.hasAttribution, "Should parse multi-source attribution");
        assertEq(result.codes.length, 3, "Should have 3 attribution sources");
        assertEq(result.codes[0], "blur", "First source should be blur");
        assertEq(result.codes[1], "opensea", "Second source should be opensea");
        assertEq(result.codes[2], "rainbow", "Third source should be rainbow");
    }
}

