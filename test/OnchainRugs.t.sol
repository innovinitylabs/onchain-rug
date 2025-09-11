// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/OnchainRugs.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";

contract OnchainRugsTest is Test, IERC721Receiver {
    OnchainRugs public onchainRugs;
    
    function setUp() public {
        onchainRugs = new OnchainRugs();
    }
    
    function testMinting() public {
        // Test data
        string[] memory textRows = new string[](1);
        textRows[0] = "TEST";
        
        string memory palette = '{"name":"Test","colors":["#FF0000","#00FF00"]}';
        string memory stripeData = '[{"y":0,"height":100,"primaryColor":"#FF0000"}]';
        string memory characterMap = '{"T":["11111","00100"],"E":["11111","10000"],"S":["01111","10001"]}';
        uint256 warpThickness = 3;
        uint256 seed = 12345;
        
        // Check text availability
        assertTrue(onchainRugs.isTextAvailable(textRows));
        
        // Calculate price
        uint256 price = onchainRugs.calculateMintingPrice(textRows);
        assertEq(price, 0.0000001 ether); // Base price for any mint
        
        // Mint NFT
        onchainRugs.mintWithText{value: price}(
            textRows,
            seed,
            palette,
            stripeData,
            warpThickness
        );
        
        // Verify minting
        assertEq(onchainRugs.totalSupply(), 1);
        assertEq(onchainRugs.ownerOf(0), address(this));
        
        // Check text is now used
        assertFalse(onchainRugs.isTextAvailable(textRows));
    }
    
    function testTokenURI() public {
        // Mint an NFT first
        string[] memory textRows = new string[](1);
        textRows[0] = "TEST";
        
        onchainRugs.mintWithText{value: 0.0000001 ether}(
            textRows,
            12345, // seed
            '{"name":"Test","colors":["#FF0000"]}',
            '[{"y":0,"height":100,"primaryColor":"#FF0000"}]',
            3
        );
        
        // Get token URI
        string memory tokenURI = onchainRugs.tokenURI(0);
        
        // Verify it's a JSON data URI
        assertTrue(_startsWith(tokenURI, "data:application/json;base64,"));
        
        // Just verify it's not empty and has reasonable length
        assertTrue(bytes(tokenURI).length > 1000);
        
        console.log("Token URI length:", bytes(tokenURI).length);
    }
    
    function testAgingSystem() public {
        // Mint an NFT
        string[] memory textRows = new string[](1);
        textRows[0] = "TEST";
        
        onchainRugs.mintWithText{value: 0.0000001 ether}(
            textRows,
            12345, // seed
            '{"name":"Test","colors":["#FF0000"]}',
            '[{"y":0,"height":100,"primaryColor":"#FF0000"}]',
            3
        );
        
        // Check initial aging state (should be clean)
        (bool showDirt, uint8 dirtLevel, bool showTexture, uint8 textureLevel) = onchainRugs.calculateAgingState(0);
        assertFalse(showDirt);
        assertEq(dirtLevel, 0);
        assertFalse(showTexture);
        assertEq(textureLevel, 0);
        
        // Check cleaning cost (should be free for first 30 days)
        uint256 cleaningCost = onchainRugs.getCleaningCost(0);
        assertEq(cleaningCost, 0);
    }
    
    function testPricing() public {
        // Test different text line counts
        string[] memory oneLine = new string[](1);
        oneLine[0] = "ONE";
        assertEq(onchainRugs.calculateMintingPrice(oneLine), 0.0000001 ether);
        
        string[] memory twoLines = new string[](2);
        twoLines[0] = "TWO";
        twoLines[1] = "LINES";
        assertEq(onchainRugs.calculateMintingPrice(twoLines), 0.0000001 ether + 0.0000001 ether);
        
        string[] memory fourLines = new string[](4);
        fourLines[0] = "FOUR";
        fourLines[1] = "LINES";
        fourLines[2] = "OF";
        fourLines[3] = "TEXT";
        assertEq(onchainRugs.calculateMintingPrice(fourLines), 0.0000001 ether + 0.0000001 ether + 0.0000001 ether + 0.0000001 ether);
    }
    
    // Helper functions
    function _startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) {
            return false;
        }
        
        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    function _contains(string memory str, string memory substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);
        
        if (substrBytes.length > strBytes.length) {
            return false;
        }
        
        for (uint i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        
        return false;
    }
    
    // Required for IERC721Receiver
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
