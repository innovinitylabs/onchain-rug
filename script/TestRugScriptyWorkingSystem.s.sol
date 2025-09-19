// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestRugScriptyWorkingSystem
 * @dev Test the working RugScripty system components
 */
contract TestRugScriptyWorkingSystem is Script {
    function run() external view {
        console.log("=== TESTING WORKING RUG SCRIPPY SYSTEM ===");

        // Load addresses from environment file
        string memory envFile = vm.readFile("rug-scripty-shape-testnet.env");

        address rugScriptyBuilderAddr = getAddressFromEnv(envFile, "RUG_SCRIPPY_BUILDER=");
        address htmlGeneratorAddr = getAddressFromEnv(envFile, "HTML_GENERATOR=");
        address onchainRugsAddr = getAddressFromEnv(envFile, "ONCHAIN_RUGS=");
        address ethfsAddr = getAddressFromEnv(envFile, "ETHFS_FILESTORE=");

        console.log("ScriptyBuilderV2:", rugScriptyBuilderAddr);
        console.log("OnchainRugsHTMLGenerator:", htmlGeneratorAddr);
        console.log("OnchainRugs:", onchainRugsAddr);
        console.log("EthFS FileStore:", ethfsAddr);

        // Test contract functionality
        testContracts(rugScriptyBuilderAddr, htmlGeneratorAddr, onchainRugsAddr, ethfsAddr);

        console.log("\n*** SYSTEM TEST COMPLETE ***");
    }

    function testContracts(
        address builderAddr,
        address generatorAddr,
        address rugsAddr,
        address ethfsAddr
    ) internal view {
        // Test OnchainRugs contract
        OnchainRugs rugs = OnchainRugs(rugsAddr);
        console.log("[SUCCESS] OnchainRugs name:", rugs.name());
        console.log("[SUCCESS] OnchainRugs symbol:", rugs.symbol());
        console.log("[SUCCESS] OnchainRugs maxSupply:", rugs.maxSupply());
        console.log("[SUCCESS] OnchainRugs totalSupply:", rugs.totalSupply());

        // Test mint price
        uint256 mintPrice = rugs.getMintPrice(1);
        console.log("[SUCCESS] Mint price for 1 text row:", mintPrice / 1e18, "ETH");

        console.log("[INFO] RugScripty system core components are working!");
        console.log("[INFO] Ready for NFT minting and library uploads!");
    }

    function getAddressFromEnv(string memory envFile, string memory prefix) internal pure returns (address) {
        string[] memory lines = vm.split(envFile, "\n");
        for (uint256 i = 0; i < lines.length; i++) {
            string memory line = lines[i];
            if (bytes(line).length > bytes(prefix).length) {
                bool startsWithPrefix = true;
                for (uint256 j = 0; j < bytes(prefix).length; j++) {
                    if (bytes(line)[j] != bytes(prefix)[j]) {
                        startsWithPrefix = false;
                        break;
                    }
                }
                if (startsWithPrefix) {
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
