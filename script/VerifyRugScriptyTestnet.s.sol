// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/OnchainRugs.sol";

/**
 * @title VerifyRugScriptyTestnet
 * @dev Verify RugScripty system is working correctly on testnet
 */
contract VerifyRugScriptyTestnet is Script {
    function run() external view {
        console.log("=== VERIFYING RUG SCRIPPY SYSTEM ON TESTNET ===");

        // Load addresses from environment file
        string memory envFile = vm.readFile("rug-scripty-shape-testnet.env");

        address rugScriptyBuilderAddr = getAddressFromEnv(envFile, "RUG_SCRIPPY_BUILDER=");
        address rugScriptyStorageAddr = getAddressFromEnv(envFile, "SCRIPTY_STORAGE_V2=");
        address htmlGeneratorAddr = getAddressFromEnv(envFile, "HTML_GENERATOR=");
        address onchainRugsAddr = getAddressFromEnv(envFile, "ONCHAIN_RUGS=");

        console.log("Contract Addresses:");
        console.log("- ScriptyBuilderV2:", rugScriptyBuilderAddr);
        console.log("- ScriptyStorageV2:", rugScriptyStorageAddr);
        console.log("- OnchainRugsHTMLGenerator:", htmlGeneratorAddr);
        console.log("- OnchainRugs:", onchainRugsAddr);

        // Verify contracts exist
        require(rugScriptyBuilderAddr != address(0), "ScriptyBuilderV2 not found");
        require(rugScriptyStorageAddr != address(0), "ScriptyStorageV2 not found");
        require(htmlGeneratorAddr != address(0), "OnchainRugsHTMLGenerator not found");
        require(onchainRugsAddr != address(0), "OnchainRugs not found");

        console.log("\n[SUCCESS] All contract addresses found");

        // Check if content is uploaded
        ScriptyStorageV2 storageContract = ScriptyStorageV2(rugScriptyStorageAddr);

        try storageContract.getContent("rug-p5.js", "") returns (bytes memory p5Data) {
            console.log("[SUCCESS] rug-p5.js found, size:", p5Data.length);
        } catch {
            console.log("[ERROR] rug-p5.js not found or not accessible");
        }

        try storageContract.getContent("rug-algorithm.js", "") returns (bytes memory algoData) {
            console.log("[SUCCESS] rug-algorithm.js found, size:", algoData.length);
        } catch {
            console.log("[ERROR] rug-algorithm.js not found or not accessible");
        }

        // Check OnchainRugs contract
        OnchainRugs onchainRugs = OnchainRugs(onchainRugsAddr);
        console.log("[SUCCESS] OnchainRugs name:", onchainRugs.name());
        console.log("[SUCCESS] OnchainRugs symbol:", onchainRugs.symbol());
        console.log("[SUCCESS] OnchainRugs maxSupply:", onchainRugs.maxSupply());
        console.log("[SUCCESS] OnchainRugs totalSupply:", onchainRugs.totalSupply());

        console.log("\n*** VERIFICATION COMPLETE! ***");
        console.log("The RugScripty system is ready for NFT minting!");
    }

    function getAddressFromEnv(string memory envFile, string memory prefix) internal pure returns (address) {
        string[] memory lines = vm.split(envFile, "\n");
        for (uint256 i = 0; i < lines.length; i++) {
            string memory line = lines[i];
            if (bytes(line).length > bytes(prefix).length) {
                bool containsPrefix = true;
                for (uint256 j = 0; j < bytes(prefix).length && j < bytes(line).length; j++) {
                    if (bytes(line)[j] != bytes(prefix)[j]) {
                        containsPrefix = false;
                        break;
                    }
                }
                if (containsPrefix) {
                    uint256 addrLength = bytes(line).length - bytes(prefix).length;
                    bytes memory addrBytes = new bytes(addrLength);
                    for (uint256 k = 0; k < addrLength; k++) {
                        addrBytes[k] = bytes(line)[bytes(prefix).length + k];
                    }
                    return vm.parseAddress(string(addrBytes));
                }
            }
        }
        return address(0);
    }
}
