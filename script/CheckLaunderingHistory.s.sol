// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/facets/RugLaunderingFacet.sol";

/**
 * @title CheckLaunderingHistory
 * @notice Check the laundering sale history for a specific NFT
 * @dev Calls getLaunderingSaleHistory() to check last sale prices
 */
contract CheckLaunderingHistory is Script {

    // Contract addresses
    address constant BASE_SEPOLIA_CONTRACT = 0xa43532205Fc90b286Da98389a9883347Cc4064a8;
    address constant SHAPE_SEPOLIA_CONTRACT = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325;

    function run(uint256 tokenId) external view {
        // Try to determine which network we're on
        if (addressExists(BASE_SEPOLIA_CONTRACT)) {
            console.log("Connected to Base Sepolia network");
            checkToken(BASE_SEPOLIA_CONTRACT, tokenId);
        } else if (addressExists(SHAPE_SEPOLIA_CONTRACT)) {
            console.log("Connected to Shape Sepolia network");
            checkToken(SHAPE_SEPOLIA_CONTRACT, tokenId);
        } else {
            console.log("Could not determine network - checking both contracts anyway");
            checkToken(BASE_SEPOLIA_CONTRACT, tokenId);
            console.log(""); // separator
            checkToken(SHAPE_SEPOLIA_CONTRACT, tokenId);
        }
    }

    function checkToken(address contractAddr, uint256 tokenId) internal view {
        console.log("Checking Token ID:", tokenId, "on contract:", contractAddr);
        console.log("============================================================");

        try RugLaunderingFacet(contractAddr).getLaunderingSaleHistory(tokenId) returns (uint256 lastSalePrice, uint256[3] memory recentPrices) {
            console.log("Last sale price:", lastSalePrice, "wei");
            console.log("Last sale price (ETH):", lastSalePrice / 1e18, "ETH");

            console.log("");
            console.log("Recent sale prices (last 3):");
            for (uint256 i = 0; i < 3; i++) {
                console.log(string(abi.encodePacked("  Price ", vm.toString(i+1), ": ", vm.toString(recentPrices[i]), " wei (", vm.toString(recentPrices[i] / 1e18), " ETH)")));
            }

            // Calculate max of recent prices
            uint256 maxRecent = 0;
            for (uint256 i = 0; i < 3; i++) {
                if (recentPrices[i] > maxRecent) {
                    maxRecent = recentPrices[i];
                }
            }

            console.log("");
            console.log(string(abi.encodePacked("Max of recent 3 prices: ", vm.toString(maxRecent), " wei (", vm.toString(maxRecent / 1e18), " ETH)")));

            // Check laundering conditions for the actual last sale price
            uint256 salePrice = lastSalePrice;
            console.log("");
            console.log(string(abi.encodePacked("Checking conditions for LAST sale price of ", vm.toString(salePrice), " wei (", vm.toString(salePrice / 1e18), " ETH):")));

            bool aboveThreshold = salePrice >= 10000000000000; // 10,000 wei threshold
            bool aboveRecentMax = salePrice > maxRecent;

            console.log(string(abi.encodePacked("  Above threshold (10k wei): ", aboveThreshold ? "YES" : "NO")));
            console.log(string(abi.encodePacked("  Above recent max: ", aboveRecentMax ? "YES" : "NO")));
            console.log(string(abi.encodePacked("  Should trigger laundering: ", (aboveThreshold && aboveRecentMax) ? "YES" : "NO")));

            // Test with a higher price to verify the fix
            uint256 testHigherPrice = maxRecent + 1000000000000000; // max + 0.001 ETH
            console.log("");
            console.log(string(abi.encodePacked("Testing FIX: Would a sale at ", vm.toString(testHigherPrice), " wei (", vm.toString(testHigherPrice / 1e18), " ETH) trigger laundering?")));

            (bool wouldTriggerHigher,) = RugLaunderingFacet(contractAddr).wouldTriggerLaundering(tokenId, testHigherPrice);
            console.log(string(abi.encodePacked("  Would trigger laundering: ", wouldTriggerHigher ? "YES - FIX WORKS!" : "NO")));

        } catch Error(string memory reason) {
            console.log(string(abi.encodePacked("[ERROR] Failed to get laundering history: ", reason)));
        } catch {
            console.log("[ERROR] Unknown error getting laundering history");
        }

        // Also check laundering stats
        try RugLaunderingFacet(contractAddr).getLaunderingStats(tokenId) returns (uint256 timesLaundered, uint256 lastLaundered, bool eligibleForLaundering) {
            console.log("");
            console.log("Laundering statistics:");
            console.log(string(abi.encodePacked("  Times laundered: ", vm.toString(timesLaundered))));
            console.log(string(abi.encodePacked("  Last laundered timestamp: ", vm.toString(lastLaundered))));
            console.log(string(abi.encodePacked("  Currently eligible for laundering: ", eligibleForLaundering ? "YES" : "NO")));
        } catch Error(string memory reason) {
            console.log(string(abi.encodePacked("[ERROR] Failed to get laundering stats: ", reason)));
        } catch {
            console.log("[ERROR] Unknown error getting laundering stats");
        }
    }

    function addressExists(address addr) internal view returns (bool) {
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(addr)
        }
        return codeSize > 0;
    }
}
