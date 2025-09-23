// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OnchainRugsHTMLGenerator.sol";
import "../src/scripty/ScriptyBuilderV2.sol";
import "../src/scripty/ScriptyStorageV2.sol";
import "../src/scripty/dependencies/ethfs/FileStore.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/diamond/facets/DiamondLoupeFacet.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/facets/RugAgingFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugCommerceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";
import "../src/libraries/LibRugStorage.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Fresh Local Deployment Script
 * @dev Deploys everything from scratch on a fresh anvil instance
 * @notice This script deploys all contracts without assuming any pre-deployed contracts
 */
contract FreshDeploy is Script {
    // Contracts to deploy
    FileStore public fileStore;
    ScriptyStorageV2 public scriptyStorage;
    ScriptyBuilderV2 public scriptyBuilder;
    OnchainRugsHTMLGenerator public htmlGenerator;

    // Main diamond contract
    Diamond public diamond;

    // Diamond contracts
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugAgingFacet public rugAgingFacet;
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugCommerceFacet public rugCommerceFacet;
    RugLaunderingFacet public rugLaunderingFacet;

    // Deployment addresses
    address public fileStoreAddr;
    address public scriptyStorageAddr;
    address public scriptyBuilderAddr;
    address public htmlGeneratorAddr;
    address public diamondAddr;

    // Libraries to upload
    string constant P5_LIBRARY_NAME = "rug-p5.js";
    string constant ALGO_LIBRARY_NAME = "rug-algo.js";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Starting fresh deployment to Anvil...");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        console.log("Deployer balance:", address(vm.addr(deployerPrivateKey)).balance / 1 ether, "ETH");

        // Step 1: Deploy FileStore
        console.log("\n1. Deploying FileStore...");
        fileStore = new FileStore(vm.addr(deployerPrivateKey));
        fileStoreAddr = address(fileStore);
        console.log("FileStore deployed at:", fileStoreAddr);

        // Step 2: Deploy ScriptyStorageV2
        console.log("\n2. Deploying ScriptyStorageV2...");
        scriptyStorage = new ScriptyStorageV2(IFileStore(fileStoreAddr), vm.addr(deployerPrivateKey));
        scriptyStorageAddr = address(scriptyStorage);
        console.log("ScriptyStorageV2 deployed at:", scriptyStorageAddr);

        // Step 3: Deploy ScriptyBuilderV2
        console.log("\n3. Deploying ScriptyBuilderV2...");
        scriptyBuilder = new ScriptyBuilderV2();
        scriptyBuilderAddr = address(scriptyBuilder);
        console.log("ScriptyBuilderV2 deployed at:", scriptyBuilderAddr);

        // Step 4: Deploy OnchainRugsHTMLGenerator
        console.log("\n4. Deploying OnchainRugsHTMLGenerator...");
        htmlGenerator = new OnchainRugsHTMLGenerator();
        htmlGeneratorAddr = address(htmlGenerator);
        console.log("OnchainRugsHTMLGenerator deployed at:", htmlGeneratorAddr);

        // Step 5: Deploy Diamond System
        console.log("\n5. Deploying Diamond system...");
        deployDiamondSystem(deployerPrivateKey);

        // Step 6: Configure Diamond with Scripty contracts
        console.log("\n6. Configuring Diamond with Scripty contracts...");
        configureDiamondWithScripty(deployerPrivateKey);

        vm.stopBroadcast();

        // Step 7: Upload libraries (separate transaction)
        console.log("\n7. Uploading JavaScript libraries...");
        uploadLibraries(deployerPrivateKey);

        console.log("\n*** Complete fresh deployment finished successfully! ***");
        console.log("===============================================");
        console.log("Contract Addresses:");
        console.log("FileStore:", fileStoreAddr);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);
        console.log("ScriptyBuilderV2:", scriptyBuilderAddr);
        console.log("OnchainRugsHTMLGenerator:", htmlGeneratorAddr);
        console.log("Diamond:", diamondAddr);
        console.log("===============================================");

        // Display testing commands
        console.log("\n*** Testing commands: ***");
        console.log("cast call", diamondAddr, "'getMintPrice(uint256)' 2 --rpc-url http://127.0.0.1:8545");
        console.log("cast send", diamondAddr, "'mintRug(string[],uint256,string,string,string,string,uint8,uint8,uint256,uint256)' '[\"HELLO\",\"WORLD\"]' 12345 'palette' 'minified' 'stripes' 'chars' 1 1 10 5 --value 0.00003ether --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
        console.log("cast call", diamondAddr, "'tokenURI(uint256)' 1 --rpc-url http://127.0.0.1:8545");
        console.log("cast call", diamondAddr, "'getAgingState(uint256)' 1 --rpc-url http://127.0.0.1:8545");
    }

    function uploadLibraries(uint256 deployerPrivateKey) internal {
        vm.startBroadcast(deployerPrivateKey);

        // Upload p5.js library
        console.log("Uploading p5.js library...");
        string memory p5Content = vm.readFile("./data/rug-p5.js");
        uploadFile(P5_LIBRARY_NAME, p5Content);

        // Upload algorithm library
        console.log("Uploading algorithm library...");
        string memory algoContent = vm.readFile("./data/rug-algo.js");
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

    function deployDiamondSystem(uint256 deployerPrivateKey) internal {

        // Deploy facets
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugAgingFacet = new RugAgingFacet();
        rugMaintenanceFacet = new RugMaintenanceFacet();
        rugCommerceFacet = new RugCommerceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();

        // Deploy diamond
        diamond = new Diamond(vm.addr(deployerPrivateKey), address(diamondCutFacet));
        diamondAddr = address(diamond);

        // Add facets to diamond - ONE BY ONE
        console.log("Adding DiamondLoupeFacet...");
        bytes4[] memory loupeSelectors = new bytes4[](4);
        loupeSelectors[0] = DiamondLoupeFacet.facets.selector;
        loupeSelectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        loupeSelectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        loupeSelectors[3] = DiamondLoupeFacet.facetAddress.selector;
        IDiamondCut.FacetCut[] memory loupeCut = new IDiamondCut.FacetCut[](1);
        loupeCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(loupeCut, address(0), "");
        console.log("DiamondLoupeFacet added successfully");

        // Add RugNFTFacet - REMOVED supportsInterface to avoid conflict with DiamondLoupeFacet
        console.log("Adding RugNFTFacet...");
        bytes4[] memory nftSelectors = new bytes4[](22);
        // RugNFTFacet specific functions
        nftSelectors[0] = RugNFTFacet.mintRug.selector;
        nftSelectors[1] = RugNFTFacet.burn.selector;
        nftSelectors[2] = RugNFTFacet.getRugData.selector;
        nftSelectors[3] = RugNFTFacet.getAgingData.selector;
        nftSelectors[4] = RugNFTFacet.totalSupply.selector;
        nftSelectors[5] = RugNFTFacet.maxSupply.selector;
        nftSelectors[6] = RugNFTFacet.isTextAvailable.selector;
        nftSelectors[7] = RugNFTFacet.getMintPrice.selector;
        nftSelectors[8] = RugNFTFacet.canMint.selector;
        nftSelectors[9] = RugNFTFacet.walletMints.selector;
        nftSelectors[10] = RugNFTFacet.isWalletException.selector;
        nftSelectors[11] = RugNFTFacet.tokenURI.selector;
        // Essential ERC721 functions
        nftSelectors[12] = bytes4(keccak256("ownerOf(uint256)"));
        nftSelectors[13] = bytes4(keccak256("balanceOf(address)"));
        nftSelectors[14] = bytes4(keccak256("transferFrom(address,address,uint256)"));
        nftSelectors[15] = bytes4(keccak256("safeTransferFrom(address,address,uint256)"));
        nftSelectors[16] = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
        nftSelectors[17] = bytes4(keccak256("approve(address,uint256)"));
        nftSelectors[18] = bytes4(keccak256("setApprovalForAll(address,bool)"));
        nftSelectors[19] = bytes4(keccak256("getApproved(uint256)"));
        nftSelectors[20] = bytes4(keccak256("isApprovedForAll(address,address)"));
        nftSelectors[21] = bytes4(keccak256("name()"));
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: nftSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(nftCut, address(0), "");
        console.log("RugNFTFacet added successfully");

        // Add RugAdminFacet
        console.log("Adding RugAdminFacet...");
        bytes4[] memory adminSelectors = new bytes4[](16);
        adminSelectors[0] = RugAdminFacet.updateCollectionCap.selector;
        adminSelectors[1] = RugAdminFacet.updateWalletLimit.selector;
        adminSelectors[2] = RugAdminFacet.updateMintPricing.selector;
        adminSelectors[3] = RugAdminFacet.updateServicePricing.selector;
        adminSelectors[4] = RugAdminFacet.updateAgingThresholds.selector;
        adminSelectors[5] = RugAdminFacet.addToExceptionList.selector;
        adminSelectors[6] = RugAdminFacet.removeFromExceptionList.selector;
        adminSelectors[7] = RugAdminFacet.setLaunderingEnabled.selector;
        adminSelectors[8] = RugAdminFacet.setLaunchStatus.selector;
        adminSelectors[9] = RugAdminFacet.setScriptyContracts.selector;
        adminSelectors[10] = RugAdminFacet.getConfig.selector;
        adminSelectors[11] = RugAdminFacet.getMintPricing.selector;
        adminSelectors[12] = RugAdminFacet.getServicePricing.selector;
        adminSelectors[13] = RugAdminFacet.getAgingThresholds.selector;
        adminSelectors[14] = RugAdminFacet.getExceptionList.selector;
        adminSelectors[15] = RugAdminFacet.isConfigured.selector;
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: adminSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(adminCut, address(0), "");
        console.log("RugAdminFacet added successfully");

        // Add RugAgingFacet
        console.log("Adding RugAgingFacet...");
        bytes4[] memory agingSelectors = new bytes4[](11);
        agingSelectors[0] = RugAgingFacet.getDirtLevel.selector;
        agingSelectors[1] = RugAgingFacet.getTextureLevel.selector;
        agingSelectors[2] = RugAgingFacet.getAgingState.selector;
        agingSelectors[3] = RugAgingFacet.canClean.selector;
        agingSelectors[4] = RugAgingFacet.canRestore.selector;
        agingSelectors[5] = RugAgingFacet.isCleaningFree.selector;
        agingSelectors[6] = RugAgingFacet.timeUntilNextDirt.selector;
        agingSelectors[7] = RugAgingFacet.timeUntilNextTexture.selector;
        agingSelectors[8] = RugAgingFacet.getAgingStats.selector;
        agingSelectors[9] = RugAgingFacet.isWellMaintained.selector;
        agingSelectors[10] = RugAgingFacet.getProgressionInfo.selector;
        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAgingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: agingSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(agingCut, address(0), "");
        console.log("RugAgingFacet added successfully");

        // Add RugMaintenanceFacet
        console.log("Adding RugMaintenanceFacet...");
        bytes4[] memory maintenanceSelectors = new bytes4[](9);
        maintenanceSelectors[0] = RugMaintenanceFacet.cleanRug.selector;
        maintenanceSelectors[1] = RugMaintenanceFacet.restoreRug.selector;
        maintenanceSelectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        maintenanceSelectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        maintenanceSelectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        maintenanceSelectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        maintenanceSelectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        maintenanceSelectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        maintenanceSelectors[8] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: maintenanceSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(maintenanceCut, address(0), "");
        console.log("RugMaintenanceFacet added successfully");

        // Add RugCommerceFacet
        console.log("Adding RugCommerceFacet...");
        bytes4[] memory commerceSelectors = new bytes4[](4);
        commerceSelectors[0] = RugCommerceFacet.withdraw.selector;
        commerceSelectors[1] = RugCommerceFacet.royaltyInfo.selector;
        commerceSelectors[2] = RugCommerceFacet.configureRoyalties.selector;
        commerceSelectors[3] = RugCommerceFacet.getBalance.selector;
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: commerceSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(commerceCut, address(0), "");
        console.log("RugCommerceFacet added successfully");

        // Add RugLaunderingFacet
        console.log("Adding RugLaunderingFacet...");
        bytes4[] memory launderingSelectors = new bytes4[](8);
        launderingSelectors[0] = RugLaunderingFacet.recordSale.selector;
        launderingSelectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        launderingSelectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        launderingSelectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        launderingSelectors[4] = RugLaunderingFacet.getSaleHistory.selector;
        launderingSelectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        launderingSelectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        launderingSelectors[7] = RugLaunderingFacet.getLaunderingStats.selector;
        IDiamondCut.FacetCut[] memory launderingCut = new IDiamondCut.FacetCut[](1);
        launderingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugLaunderingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: launderingSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(launderingCut, address(0), "");
        console.log("RugLaunderingFacet added successfully");
    }

    function configureDiamondWithScripty(uint256 deployerPrivateKey) internal {

        // Configure Scripty contracts
        RugAdminFacet(address(diamond)).setScriptyContracts(
            scriptyBuilderAddr,
            scriptyStorageAddr,
            htmlGeneratorAddr
        );

        // Configure initial parameters for testing
        RugAdminFacet(address(diamond)).updateCollectionCap(10000);
        RugAdminFacet(address(diamond)).updateWalletLimit(7);
        // Set pricing to match test expectations: basePrice = 0.00001, line prices add up correctly
        uint256[6] memory mintPrices = [uint256(0.00001 ether), 0.00001 ether, 0.00001 ether, 0 ether, 0 ether, 0 ether];
        RugAdminFacet(address(diamond)).updateMintPricing(mintPrices);

        // Configure aging thresholds (in seconds for testing)
        uint256[6] memory thresholds = [uint256(300), 600, 1800, 3600, 7200, 14400];
        RugAdminFacet(address(diamond)).updateAgingThresholds(thresholds);

        // Configure royalties (5% to deployer for testing)
        address[] memory royaltyRecipients = new address[](1);
        royaltyRecipients[0] = vm.addr(deployerPrivateKey);
        uint256[] memory royaltySplits = new uint256[](1);
        royaltySplits[0] = 500; // 5% in basis points
        RugCommerceFacet(payable(address(diamond))).configureRoyalties(500, royaltyRecipients, royaltySplits);
    }
}
