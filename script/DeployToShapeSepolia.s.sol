// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugs.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/scripty/dependencies/ethfs/FileStore.sol";

/**
 * @title Simple CREATE2 Deployer for Testnet Deployment
 */
contract Create2Deployer {
    event Deployed(address addr, bytes32 salt);

    function deploy(bytes32 salt, bytes memory initCode) external returns (address addr) {
        assembly {
            addr := create2(0, add(initCode, 0x20), mload(initCode), salt)
        }
        require(addr != address(0), "Create2Deployer: deployment failed");
        emit Deployed(addr, salt);
    }

    function computeAddress(bytes32 salt, bytes memory initCode) external view returns (address addr) {
        bytes32 initCodeHash = keccak256(initCode);
        addr = address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            initCodeHash
        )))));
    }
}

contract DeployToShapeSepolia is Script {
    // Contracts to deploy
    Create2Deployer public create2Deployer;
    FileStore public fileStore;
    ScriptyStorageV2 public scriptyStorage;
    ScriptyBuilderV2 public scriptyBuilder;
    OnchainRugsHTMLGenerator public htmlGenerator;
    OnchainRugs public onchainRugs;

    // Deployment addresses (will be set after deployment)
    address public create2DeployerAddr;
    address public fileStoreAddr;
    address public scriptyStorageAddr;
    address public scriptyBuilderAddr;
    address public htmlGeneratorAddr;
    address public onchainRugsAddr;

    // Libraries to upload
    string constant P5_LIBRARY_NAME = "onchainrugs-p5.js.b64";
    string constant ALGO_LIBRARY_NAME = "onchainrugs.js.b64";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting deployment to Shape Sepolia...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));

        // Step 1: Deploy CREATE2Deployer
        console.log("\\n1. Deploying CREATE2Deployer...");
        create2Deployer = new Create2Deployer();
        create2DeployerAddr = address(create2Deployer);
        console.log("CREATE2Deployer deployed at:", create2DeployerAddr);

        // Step 2: Deploy FileStore
        console.log("\\n2. Deploying FileStore...");
        fileStore = new FileStore(create2DeployerAddr);
        fileStoreAddr = address(fileStore);
        console.log("FileStore deployed at:", fileStoreAddr);

        // Step 3: Deploy ScriptyStorageV2
        console.log("\\n3. Deploying ScriptyStorageV2...");
        scriptyStorage = new ScriptyStorageV2(IFileStore(fileStoreAddr), vm.addr(deployerPrivateKey));
        scriptyStorageAddr = address(scriptyStorage);
        console.log("ScriptyStorageV2 deployed at:", scriptyStorageAddr);

        // Step 4: Deploy ScriptyBuilderV2
        console.log("\\n4. Deploying ScriptyBuilderV2...");
        scriptyBuilder = new ScriptyBuilderV2();
        scriptyBuilderAddr = address(scriptyBuilder);
        console.log("ScriptyBuilderV2 deployed at:", scriptyBuilderAddr);

        // Step 5: Deploy OnchainRugsHTMLGenerator
        console.log("\\n5. Deploying OnchainRugsHTMLGenerator...");
        htmlGenerator = new OnchainRugsHTMLGenerator();
        htmlGeneratorAddr = address(htmlGenerator);
        console.log("OnchainRugsHTMLGenerator deployed at:", htmlGeneratorAddr);

        // Step 6: Deploy OnchainRugs main contract
        console.log("\\n6. Deploying OnchainRugs...");
        onchainRugs = new OnchainRugs();
        onchainRugsAddr = address(onchainRugs);
        console.log("OnchainRugs deployed at:", onchainRugsAddr);

        // Step 7: Configure OnchainRugs with Scripty addresses
        console.log("\\n7. Configuring OnchainRugs with Scripty contracts...");
        onchainRugs.setRugScriptyContracts(
            scriptyBuilderAddr,
            fileStoreAddr,
            htmlGeneratorAddr
        );
        console.log("OnchainRugs configured successfully");

        vm.stopBroadcast();

        // Step 8: Upload libraries (separate transaction)
        console.log("\\n8. Uploading JavaScript libraries...");
        uploadLibraries(deployerPrivateKey);

        console.log("\\nDeployment completed successfully!");
        console.log("========================================");
        console.log("Contract Addresses:");
        console.log("CREATE2Deployer:", create2DeployerAddr);
        console.log("FileStore:", fileStoreAddr);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);
        console.log("ScriptyBuilderV2:", scriptyBuilderAddr);
        console.log("OnchainRugsHTMLGenerator:", htmlGeneratorAddr);
        console.log("OnchainRugs:", onchainRugsAddr);
        console.log("========================================");
    }

    function uploadLibraries(uint256 deployerPrivateKey) internal {
        vm.startBroadcast(deployerPrivateKey);

        // Upload p5.js library
        console.log("Uploading p5.js library...");
        string memory p5Content = vm.readFile("./data/rug-p5.js.b64");
        uploadFile(P5_LIBRARY_NAME, p5Content);

        // Upload algorithm library
        console.log("Uploading algorithm library...");
        string memory algoContent = vm.readFile("./data/rug-algo.js.b64");
        uploadFile(ALGO_LIBRARY_NAME, algoContent);

        vm.stopBroadcast();
        console.log("Libraries uploaded successfully");
    }

    function uploadFile(string memory fileName, string memory content) internal {
        bytes memory contentBytes = bytes(content);

        // Split into 20KB chunks
        uint256 chunkSize = 20000; // 20KB chunks
        uint256 totalChunks = (contentBytes.length + chunkSize - 1) / chunkSize;

        console.log("File:", fileName);
        console.log("Size:", contentBytes.length, "bytes");
        console.log("Chunks:", totalChunks);

        // Create the content in ScriptyStorage
        scriptyStorage.createContent(fileName, "");

        // Upload chunks
        for (uint256 i = 0; i < totalChunks; i++) {
            uint256 start = i * chunkSize;
            uint256 end = start + chunkSize;
            if (end > contentBytes.length) {
                end = contentBytes.length;
            }

            bytes memory chunk = new bytes(end - start);
            for (uint256 j = start; j < end; j++) {
                chunk[j - start] = contentBytes[j];
            }

            scriptyStorage.addChunkToContent(fileName, chunk);
            console.log("Uploaded chunk", i + 1, "/", totalChunks);
        }

        // Freeze the content
        scriptyStorage.freezeContent(fileName);
        console.log("Content", fileName, "uploaded and frozen");
    }
}
