// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/libraries/LibRugStorage.sol";

contract FixReferralMappings is Script {
    address public diamondAddr;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT");
        console.log("Fixing referral mappings at:", diamondAddr);

        // Fix the broken mapping
        LibRugStorage.ReferralConfig storage rs = LibRugStorage.attributionStorage();
        address referrer = 0x14fb5d894d7E62F3E69Ea985273e9eE31e8fe72C;
        string memory code = "nVQEAJ1Ma";

        // Ensure the mappings are correct
        rs.codeToReferrer[code] = referrer;
        rs.codeExists[code] = true;
        rs.referrerToCode[referrer] = code;

        console.log("Fixed mapping for referrer:", referrer);
        console.log("Code:", code);

        vm.stopBroadcast();
    }
}