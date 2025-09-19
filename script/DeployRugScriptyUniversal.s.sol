// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/OnchainRugs.sol";
import "../src/scripty/dependencies/ethfs/Create2Deployer.sol";
import "../src/scripty/dependencies/ethfs/FileStore.sol";

/**
 * @title DeployRugScriptyUniversal
 * @dev Deploy complete RugScripty system to any network (local or testnet)
 */
contract DeployRugScriptyUniversal is Script {
    function run() external {
        uint256 deployerPrivateKey;
        address ethfsFileStoreAddr;
        string memory networkName;
        string memory rpcUrl;
        string memory explorerUrl;

        // Detect environment and set appropriate values
        if (block.chainid == 31337) {
            // Local Anvil
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
            networkName = "Local Anvil";
            rpcUrl = "http://127.0.0.1:8545";
            explorerUrl = "N/A";
            ethfsFileStoreAddr = address(0); // Will deploy local mock
        } else if (block.chainid == 11011) {
            // Shape L2 Testnet
            deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
            networkName = "Shape L2 Testnet";
            rpcUrl = "https://sepolia.shape.network";
            explorerUrl = "https://explorer-sepolia.shape.network";
            ethfsFileStoreAddr = 0xFe1411d6864592549AdE050215482e4385dFa0FB; // Real EthFS
        } else {
            revert("Unsupported network");
        }

        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== DEPLOYING RUG SCRIPPY SYSTEM ===");
        console.log("Network:", networkName);
        console.log("Chain ID:", block.chainid);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        // Set gas settings for L2
        if (block.chainid == 11011) {
            vm.txGasPrice(2000000000); // 2 gwei for Shape L2
        }

        vm.startBroadcast(deployerPrivateKey);

        // ============================================================================
        // 1. SETUP ETHFS (Local Mock or Real)
        // ============================================================================

        address actualEthfsAddr;

        if (block.chainid == 31337) {
            // Deploy real EthFS system locally
            console.log("\n1. Deploying Real EthFS System Locally...");

            console.log("   Deploying Create2Deployer...");
            Create2Deployer create2Deployer = new Create2Deployer();
            console.log("   Create2Deployer deployed at:", address(create2Deployer));

            console.log("   Deploying FileStore...");
            FileStore fileStore = new FileStore(address(create2Deployer));
            console.log("   FileStore deployed at:", address(fileStore));

            actualEthfsAddr = address(fileStore);
            console.log("   Real EthFS system ready with SSTORE2 support!");
        } else {
            // Use real EthFS on testnet
            console.log("\n1. Using Real EthFS on Testnet...");
            actualEthfsAddr = ethfsFileStoreAddr;
            console.log("   EthFS FileStore:", actualEthfsAddr);
        }

        // ============================================================================
        // 2. DEPLOY CORE RUG SCRIPPY CONTRACTS
        // ============================================================================

        console.log("\n2. Deploying ScriptyBuilderV2...");
        ScriptyBuilderV2 scriptyBuilder = new ScriptyBuilderV2();
        console.log("   ScriptyBuilderV2 deployed at:", address(scriptyBuilder));

        console.log("\n3. Deploying ScriptyStorageV2...");
        ScriptyStorageV2 scriptyStorage = new ScriptyStorageV2(IFileStore(actualEthfsAddr));
        console.log("   ScriptyStorageV2 deployed at:", address(scriptyStorage));

        console.log("\n4. Deploying OnchainRugsHTMLGenerator...");
        OnchainRugsHTMLGenerator htmlGenerator = new OnchainRugsHTMLGenerator();
        console.log("   OnchainRugsHTMLGenerator deployed at:", address(htmlGenerator));

        console.log("\n5. Deploying OnchainRugs...");
        OnchainRugs onchainRugs = new OnchainRugs();
        console.log("   OnchainRugs deployed at:", address(onchainRugs));

        // ============================================================================
        // 3. SETUP CONTRACT RELATIONSHIPS
        // ============================================================================

        console.log("\n6. Setting up contract relationships...");
        onchainRugs.setRugScriptyContracts(
            address(scriptyBuilder),
            address(scriptyStorage),
            address(htmlGenerator)
        );
        console.log("   Contract relationships established!");

        vm.stopBroadcast();

        // ============================================================================
        // 4. DEPLOYMENT SUMMARY
        // ============================================================================

        string memory deploymentInfo = string(abi.encodePacked(
            "========================================\n",
            "RUG SCRIPPY SYSTEM DEPLOYMENT COMPLETE\n",
            "========================================\n\n",
            "Network: ", networkName, " (Chain ID: ", vm.toString(block.chainid), ")\n",
            "RPC URL: ", rpcUrl, "\n",
            "Block Explorer: ", explorerUrl, "\n\n",
            "EthFS System:\n",
            "- EthFS FileStore: ", vm.toString(actualEthfsAddr), "\n"
        ));

        if (block.chainid == 31337) {
            deploymentInfo = string(abi.encodePacked(
                deploymentInfo,
                "- Create2Deployer: ", vm.toString(address(Create2Deployer(FileStore(actualEthfsAddr).deployer()))), "\n",
                "- FileStore: ", vm.toString(actualEthfsAddr), "\n\n"
            ));
        }

        deploymentInfo = string(abi.encodePacked(
            deploymentInfo,
            "Core Contracts:\n",
            "- ScriptyBuilderV2: ", vm.toString(address(scriptyBuilder)), "\n",
            "- ScriptyStorageV2: ", vm.toString(address(scriptyStorage)), "\n",
            "- OnchainRugsHTMLGenerator: ", vm.toString(address(htmlGenerator)), "\n\n",
            "NFT Contract:\n",
            "- OnchainRugs: ", vm.toString(address(onchainRugs)), "\n\n",
            "NEXT STEPS:\n",
            "1. Upload JavaScript libraries\n",
            "2. Test NFT minting\n",
            "3. Verify on-chain HTML generation\n\n",
            "TEST COMMANDS:\n",
            "forge script script/TestMintWithData.s.sol --rpc-url ", rpcUrl, " --broadcast\n",
            "cast call ", vm.toString(address(onchainRugs)), ' "tokenURI(uint256)" 1 --rpc-url ', rpcUrl, "\n"
        ));

        if (block.chainid == 11011) {
            deploymentInfo = string(abi.encodePacked(
                deploymentInfo,
                "\nVERIFICATION:\n",
                "forge verify-contract ", vm.toString(address(scriptyBuilder)), " src/scripty/ScriptyBuilderV2.sol:ScriptyBuilderV2 --chain 11011\n",
                "forge verify-contract ", vm.toString(address(scriptyStorage)), " src/scripty/ScriptyStorageV2.sol:ScriptyStorageV2 --chain 11011\n",
                "forge verify-contract ", vm.toString(address(htmlGenerator)), " src/OnchainRugsHTMLGenerator.sol:OnchainRugsHTMLGenerator --chain 11011\n",
                "forge verify-contract ", vm.toString(address(onchainRugs)), " src/OnchainRugs.sol:OnchainRugs --chain 11011\n"
            ));
        }

        console.log(deploymentInfo);

        // Save deployment info
        string memory filename = block.chainid == 31337 ?
            "rug-scripty-local-deployment.txt" :
            "rug-scripty-testnet-deployment.txt";

        vm.writeFile(filename, deploymentInfo);
        console.log("Deployment info saved to", filename);

        // Save contract addresses
        string memory envFilename = block.chainid == 31337 ?
            "rug-scripty-local.env" :
            "rug-scripty-testnet.env";

        string memory addresses = string(abi.encodePacked(
            "# RugScripty ", networkName, " Addresses\n",
            "RUG_SCRIPPY_BUILDER=", vm.toString(address(scriptyBuilder)), "\n",
            "SCRIPTY_STORAGE_V2=", vm.toString(address(scriptyStorage)), "\n",
            "HTML_GENERATOR=", vm.toString(address(htmlGenerator)), "\n",
            "ONCHAIN_RUGS=", vm.toString(address(onchainRugs)), "\n",
            "ETHFS_FILESTORE=", vm.toString(actualEthfsAddr), "\n"
        ));

        vm.writeFile(envFilename, addresses);
        console.log("Contract addresses saved to", envFilename);

        console.log("\n*** RUG SCRIPPY SYSTEM SUCCESSFULLY DEPLOYED! ***");
        console.log("Ready for JavaScript library uploads and NFT minting!");
        console.log("SSTORE2 chunking is now available in both local and testnet environments!");
    }
}
