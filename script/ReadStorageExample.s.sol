// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/scripty/ScriptyStorageV2.sol";

contract ReadStorageExample is Script {

    function run() external view {
        // Your deployed ScriptyStorageV2 contract address
        address storageAddress = 0xB1Ba134624AD99e719988aD83882010d82Fb3417;
        ScriptyStorageV2 scriptyStorage = ScriptyStorageV2(storageAddress);

        console.log("Querying Scripty Storage...");

        // Query your uploaded libraries
        readLibrary("rug-p5.js.b64", scriptyStorage);
        readLibrary("rug-algo.js.b64", scriptyStorage);
    }

    function readLibrary(string memory name, ScriptyStorageV2 storage_) internal view {
        console.log(string.concat("\n=== Reading library: ", name, " ==="));

        try storage_.getContent(name, "") returns (bytes memory content) {
            console.log("Success! File size:", content.length, "bytes");

            // Convert first 100 bytes to string for preview
            if (content.length > 0) {
                uint256 previewLength = content.length > 100 ? 100 : content.length;
                bytes memory preview = new bytes(previewLength);
                for (uint256 i = 0; i < previewLength; i++) {
                    preview[i] = content[i];
                }
                console.log("Preview (first 100 bytes):", string(preview));
            }

        } catch {
            console.log("Error: Library not found or empty");
        }

        // Also get chunk pointers
        try storage_.getContentChunkPointers(name) returns (address[] memory pointers) {
            console.log("Number of chunks:", pointers.length);
            if (pointers.length > 0) {
                console.log("First chunk pointer:", pointers[0]);
            }
        } catch {
            console.log("Error getting chunk pointers");
        }
    }
}
