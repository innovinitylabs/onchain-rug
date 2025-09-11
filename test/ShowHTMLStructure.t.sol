// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/OnchainRugs.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";

contract ShowHTMLStructureTest is Test, IERC721Receiver {
    OnchainRugs public onchainRugs;
    
    function setUp() public {
        onchainRugs = new OnchainRugs();
        
        // Mint a test NFT
        string[] memory textRows = new string[](1);
        textRows[0] = "HELLO";
        
        onchainRugs.mintWithText{value: 0.0001 ether}(
            textRows,
            12345,
            '{"name":"Test","colors":["#FF0000","#00FF00","#0000FF"]}',
            '[{"y":0,"height":100,"primaryColor":"#FF0000","secondaryColor":"#00FF00","weaveType":"mixed"}]',
            3
        );
    }
    
    function testShowHTMLStructure() public {
        // Get tokenURI
        string memory tokenURI = onchainRugs.tokenURI(0);
        console.log("=== TokenURI Structure ===");
        console.log("TokenURI length:", bytes(tokenURI).length);
        console.log("TokenURI starts with:", _substring(tokenURI, 0, 50));
        
        // Extract the base64 JSON part
        string memory base64Json = _extractBase64(tokenURI);
        console.log("Base64 JSON length:", bytes(base64Json).length);
        console.log("Base64 JSON starts with:", _substring(base64Json, 0, 50));
        
        // Show the structure without decoding
        console.log("=== HTML Structure Analysis ===");
        console.log("1. TokenURI format: data:application/json;base64,<json>");
        console.log("2. JSON contains: name, description, image, animation_url, attributes");
        console.log("3. animation_url format: data:text/html;base64,<html>");
        console.log("4. HTML contains: DOCTYPE, p5.js script, algorithm, NFT data, initialization");
        
        // Show what the HTML should contain based on the contract
        console.log("=== Expected HTML Content ===");
        console.log("HTML should start with: <!DOCTYPE html><html><head>");
        console.log("HTML should contain: <script src=\"https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js\"></script>");
        console.log("HTML should contain: The complete P5.js algorithm");
        console.log("HTML should contain: let seed = 12345;");
        console.log("HTML should contain: let p = <palette_json>;");
        console.log("HTML should contain: let sd = <stripe_data_json>;");
        console.log("HTML should contain: let tr = [\"HELLO\"];");
        console.log("HTML should contain: let cm = <character_map_json>;");
        console.log("HTML should contain: let wp = 3;");
        console.log("HTML should contain: let sdirt = false; (or true based on aging)");
        console.log("HTML should contain: let dl = 0; (dirt level)");
        console.log("HTML should contain: let stex = false; (or true based on aging)");
        console.log("HTML should contain: let tl = 0; (texture level)");
        console.log("HTML should contain: noiseSeed(seed); window.initPRNG(seed);");
        console.log("HTML should end with: </script></body></html>");
        
        // Verify the structure is correct
        assertTrue(_startsWith(tokenURI, "data:application/json;base64,"), "TokenURI should start with data:application/json;base64,");
        assertTrue(bytes(tokenURI).length > 10000, "TokenURI should be substantial length");
        assertTrue(bytes(base64Json).length > 5000, "Base64 JSON should be substantial length");
    }
    
    function _extractBase64(string memory dataUri) internal pure returns (string memory) {
        bytes memory data = bytes(dataUri);
        uint256 commaIndex = 0;
        
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i] == ',') {
                commaIndex = i;
                break;
            }
        }
        
        require(commaIndex > 0, "No comma found in data URI");
        
        bytes memory result = new bytes(data.length - commaIndex - 1);
        for (uint256 i = commaIndex + 1; i < data.length; i++) {
            result[i - commaIndex - 1] = data[i];
        }
        
        return string(result);
    }
    
    function _substring(string memory str, uint256 start, uint256 end) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(start <= end && end <= strBytes.length, "Invalid substring bounds");
        
        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }
        
        return string(result);
    }
    
    function _startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (prefixBytes.length > strBytes.length) return false;
        
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) return false;
        }
        
        return true;
    }
    
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
