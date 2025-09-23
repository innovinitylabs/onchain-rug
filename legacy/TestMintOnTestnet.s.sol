// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";

/**
 * @title TestMintOnTestnet
 * @dev Forge script to test minting functionality on testnet using test data
 */
contract TestMintOnTestnet is Script {
    OnchainRugs public onchainRugs;

    // Testnet contract address (update this with your deployed contract address)
    address constant ONCHAIN_RUGS_ADDRESS = 0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459;

    // Test minting data from test_mint_data.json
    string[] public textRows = ["VALIPOKKANN"];
    uint256 constant SEED = 8463;
    string constant PALETTE_NAME = "Royal Stewart";
    string constant MINIFIED_PALETTE = "{\"name\":\"Royal Stewart\",\"colors\":[\"#e10600\",\"#ffffff\",\"#000000\",\"#ffd700\",\"#007a3d\"]}";
    string constant MINIFIED_STRIPE_DATA = "[{\"y\":0,\"h\":72.2,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"s\",\"wv\":0.406},{\"y\":72.2,\"h\":71.922,\"pc\":\"#ffffff\",\"sc\":null,\"wt\":\"s\",\"wv\":0.234},{\"y\":144.123,\"h\":37.037,\"pc\":\"#007a3d\",\"sc\":null,\"wt\":\"s\",\"wv\":0.178},{\"y\":181.159,\"h\":69.49,\"pc\":\"#e10600\",\"sc\":null,\"wt\":\"s\",\"wv\":0.135},{\"y\":250.649,\"h\":42.179,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"m\",\"wv\":0.454},{\"y\":292.828,\"h\":39.344,\"pc\":\"#007a3d\",\"sc\":null,\"wt\":\"t\",\"wv\":0.313},{\"y\":332.172,\"h\":46.537,\"pc\":\"#e10600\",\"sc\":null,\"wt\":\"s\",\"wv\":0.164},{\"y\":378.709,\"h\":75.408,\"pc\":\"#000000\",\"sc\":\"#e10600\",\"wt\":\"t\",\"wv\":0.447},{\"y\":454.116,\"h\":66.138,\"pc\":\"#e10600\",\"sc\":\"#ffd700\",\"wt\":\"s\",\"wv\":0.318},{\"y\":520.254,\"h\":56.996,\"pc\":\"#e10600\",\"sc\":null,\"wt\":\"s\",\"wv\":0.332},{\"y\":577.25,\"h\":26.414,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"s\",\"wv\":0.452},{\"y\":603.664,\"h\":57.912,\"pc\":\"#007a3d\",\"sc\":null,\"wt\":\"t\",\"wv\":0.225},{\"y\":661.576,\"h\":55.544,\"pc\":\"#e10600\",\"sc\":null,\"wt\":\"s\",\"wv\":0.155},{\"y\":717.12,\"h\":31.582,\"pc\":\"#e10600\",\"sc\":null,\"wt\":\"s\",\"wv\":0.353},{\"y\":748.702,\"h\":23.152,\"pc\":\"#ffd700\",\"sc\":null,\"wt\":\"t\",\"wv\":0.232},{\"y\":771.854,\"h\":77.692,\"pc\":\"#000000\",\"sc\":null,\"wt\":\"t\",\"wv\":0.113},{\"y\":849.546,\"h\":29.627,\"pc\":\"#007a3d\",\"sc\":\"#ffffff\",\"wt\":\"m\",\"wv\":0.203},{\"y\":879.173,\"h\":62.08,\"pc\":\"#ffffff\",\"sc\":null,\"wt\":\"s\",\"wv\":0.477},{\"y\":941.253,\"h\":59.431,\"pc\":\"#ffd700\",\"sc\":null,\"wt\":\"s\",\"wv\":0.311},{\"y\":1000.683,\"h\":23.506,\"pc\":\"#007a3d\",\"sc\":\"#ffffff\",\"wt\":\"s\",\"wv\":0.272},{\"y\":1024.19,\"h\":22.586,\"pc\":\"#ffd700\",\"sc\":null,\"wt\":\"s\",\"wv\":0.45},{\"y\":1046.775,\"h\":77.096,\"pc\":\"#007a3d\",\"sc\":null,\"wt\":\"s\",\"wv\":0.234},{\"y\":1123.871,\"h\":22.971,\"pc\":\"#007a3d\",\"sc\":null,\"wt\":\"s\",\"wv\":0.101},{\"y\":1146.842,\"h\":53.158,\"pc\":\"#e10600\",\"sc\":null,\"wt\":\"s\",\"wv\":0.319}]";
    string constant FILTERED_CHARACTER_MAP = "{\"V\":[\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01010\",\"00100\"],\"A\":[\"01110\",\"10001\",\"10001\",\"11111\",\"10001\",\"10001\",\"10001\"],\"L\":[\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"10000\",\"11111\"],\"I\":[\"11111\",\"00100\",\"00100\",\"00100\",\"00100\",\"00100\",\"11111\"],\"P\":[\"11110\",\"10001\",\"10001\",\"11110\",\"10000\",\"10000\",\"10000\"],\"O\":[\"01110\",\"10001\",\"10001\",\"10001\",\"10001\",\"10001\",\"01110\"],\"K\":[\"10001\",\"10010\",\"10100\",\"11000\",\"10100\",\"10010\",\"10001\"],\"N\":[\"10001\",\"11001\",\"10101\",\"10011\",\"10001\",\"10001\",\"10001\"],\" \":[\"00000\",\"00000\",\"00000\",\"00000\",\"00000\",\"00000\",\"00000\"]}";
    uint8 constant WARP_THICKNESS = 1;
    uint8 constant COMPLEXITY = 2;
    uint256 constant CHARACTER_COUNT = 10;
    uint256 constant STRIPE_COUNT = 24;

    function setUp() public {
        // Initialize contract instance
        onchainRugs = OnchainRugs(ONCHAIN_RUGS_ADDRESS);
    }

    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting test mint on Shape Sepolia testnet...");
        console.log("Contract address:", ONCHAIN_RUGS_ADDRESS);
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        // Check current supply before minting
        uint256 supplyBefore = onchainRugs.totalSupply();
        console.log("Total supply before minting:", supplyBefore);

        // Check mint price
        uint256 mintPrice = onchainRugs.getMintPrice(textRows.length);
        console.log("Mint price:", mintPrice, "wei");
        console.log("Mint price in ETH:", mintPrice / 1e18);

        // Mint the rug
        console.log("\\nMinting rug with test data...");
        console.log("Text:", textRows[0]);
        console.log("Seed:", SEED);
        console.log("Palette:", PALETTE_NAME);
        console.log("Warp Thickness:", WARP_THICKNESS);

        try onchainRugs.mintRug{value: mintPrice}(
            textRows,
            SEED,
            PALETTE_NAME,
            MINIFIED_STRIPE_DATA,
            MINIFIED_PALETTE,
            FILTERED_CHARACTER_MAP,
            WARP_THICKNESS,
            COMPLEXITY,
            CHARACTER_COUNT,
            STRIPE_COUNT
        ) {
            console.log("Minting successful!");

            // Check supply after minting
            uint256 supplyAfter = onchainRugs.totalSupply();
            console.log("Total supply after minting:", supplyAfter);

            if (supplyAfter > supplyBefore) {
                uint256 newTokenId = supplyAfter;
                console.log("New token ID:", newTokenId);

                // Get the owner of the new token
                address owner = onchainRugs.ownerOf(newTokenId);
                console.log("Token owner:", owner);

                // Emit mint event for tracking
                console.log("\\n=== MINT SUCCESSFUL ===");
                console.log("Token ID:", newTokenId);
                console.log("Owner:", owner);
                console.log("Text:", textRows[0]);
                console.log("Block timestamp:", block.timestamp);
            }
        } catch Error(string memory reason) {
            console.log("Minting failed with reason:", reason);
        } catch (bytes memory) {
            console.log("Minting failed with unknown error");
        }

        vm.stopBroadcast();
    }

    // Helper function to get mint price in a more readable format
    function getMintPriceInEth() public view returns (uint256) {
        uint256 price = onchainRugs.getMintPrice(textRows.length);
        return price / 1e18;
    }

    // Helper function to check if contract is paused
    function isContractPaused() public view returns (bool) {
        try onchainRugs.paused() returns (bool _paused) {
            return _paused;
        } catch {
            return true; // Assume paused if we can't read it
        }
    }

    // Helper function to get current supply
    function getCurrentSupply() public view returns (uint256) {
        try onchainRugs.totalSupply() returns (uint256 supply) {
            return supply;
        } catch {
            return 0;
        }
    }
}
