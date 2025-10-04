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
 * @title Shape Sepolia Testnet Deployment Script
 * @dev Fresh deployment to Shape Sepolia testnet
 * @notice Deploys all contracts from scratch without any dependencies
 */
contract DeployShapeSepolia is Script {
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

    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;

    function setUp() public {
        deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
    }

    function run() public {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Starting OnchainRugs Shape Sepolia Deployment");
        console.log("=========================================");

        deployInfrastructure();
        deployDiamond();
        configureDiamond();
        uploadLibraries();
        initializeSystem();

        console.log("=========================================");
        console.log("Shape Sepolia Deployment Complete!");
        console.log("=========================================");
        console.log("FileStore:", fileStoreAddr);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);
        console.log("ScriptyBuilderV2:", scriptyBuilderAddr);
        console.log("HTMLGenerator:", htmlGeneratorAddr);
        console.log("Diamond:", diamondAddr);
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function deployInfrastructure() internal {
        console.log("1. Deploying FileStore...");
        // For Shape Sepolia, we'll use a simple deployer address
        // In production, you'd want a proper CREATE2 deployer
        fileStore = new FileStore(address(0x4e59b44847b379578588920cA78FbF26c0B4956C)); // Using a known address
        fileStoreAddr = address(fileStore);
        console.log("   FileStore deployed at:", fileStoreAddr);

        console.log("2. Deploying ScriptyStorageV2...");
        scriptyStorage = new ScriptyStorageV2(IFileStore(fileStoreAddr), deployer);
        scriptyStorageAddr = address(scriptyStorage);
        console.log("   ScriptyStorageV2 deployed at:", scriptyStorageAddr);

        console.log("3. Deploying ScriptyBuilderV2...");
        scriptyBuilder = new ScriptyBuilderV2();
        scriptyBuilderAddr = address(scriptyBuilder);
        console.log("   ScriptyBuilderV2 deployed at:", scriptyBuilderAddr);

        console.log("4. Deploying OnchainRugsHTMLGenerator...");
        htmlGenerator = new OnchainRugsHTMLGenerator();
        htmlGeneratorAddr = address(htmlGenerator);
        console.log("   OnchainRugsHTMLGenerator deployed at:", htmlGeneratorAddr);
    }

    function deployDiamond() internal {
        console.log("5. Deploying Diamond system...");

        console.log("   Deploying DiamondCutFacet...");
        diamondCutFacet = new DiamondCutFacet();
        console.log("   DiamondCutFacet deployed");

        console.log("   Deploying DiamondLoupeFacet...");
        diamondLoupeFacet = new DiamondLoupeFacet();
        console.log("   DiamondLoupeFacet deployed");

        console.log("   Deploying main Diamond contract...");
        diamond = new Diamond(deployer, address(diamondCutFacet));
        diamondAddr = address(diamond);
        console.log("   Diamond deployed at:", diamondAddr);

        console.log("   Deploying Rug facets...");
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugAgingFacet = new RugAgingFacet();
        rugMaintenanceFacet = new RugMaintenanceFacet();
        rugCommerceFacet = new RugCommerceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();
        console.log("   All Rug facets deployed");
    }

    function configureDiamond() internal {
        console.log("6. Configuring Diamond with facets...");

        // Add DiamondLoupeFacet
        IDiamondCut.FacetCut[] memory loupeCut = new IDiamondCut.FacetCut[](1);
        loupeCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getDiamondLoupeSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(loupeCut, address(0), "");
        console.log("   Added DiamondLoupeFacet");

        // Add RugNFTFacet (manually specify selectors to avoid conflicts)
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugNFTSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(nftCut, address(0), "");
        console.log("   Added RugNFTFacet with all ERC721 functions");

        // Add RugAdminFacet
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAdminSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(adminCut, address(0), "");
        console.log("   Added RugAdminFacet");

        // Add RugAgingFacet
        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAgingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAgingSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(agingCut, address(0), "");
        console.log("   Added RugAgingFacet");

        // Add RugMaintenanceFacet
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugMaintenanceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(maintenanceCut, address(0), "");
        console.log("   Added RugMaintenanceFacet");

        // Add RugCommerceFacet
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugCommerceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(commerceCut, address(0), "");
        console.log("   Added RugCommerceFacet");

        // Add RugLaunderingFacet
        IDiamondCut.FacetCut[] memory launderingCut = new IDiamondCut.FacetCut[](1);
        launderingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugLaunderingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugLaunderingSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(launderingCut, address(0), "");
        console.log("   Added RugLaunderingFacet");
    }

    function uploadLibraries() internal {
        console.log("7. Uploading JavaScript libraries...");

        // Upload p5.js library
        console.log("   Uploading p5.js library...");
        string memory p5Content = vm.readFile("data/rug-p5.js");
        uploadFile("rug-p5.js", p5Content);

        // Upload algorithm library
        console.log("   Uploading algorithm library...");
        string memory algoContent = vm.readFile("data/rug-algo.js");
        uploadFile("rug-algo.js", algoContent);

        // Upload frame library
        console.log("   Uploading frame library...");
        string memory frameContent = vm.readFile("data/rug-frame.js");
        uploadFile("rug-frame.js", frameContent);

        console.log("   Libraries uploaded successfully");
    }

    function uploadFile(string memory fileName, string memory content) internal {
        bytes memory contentBytes = bytes(content);

        // Split into 20KB chunks (like the legacy script)
        uint256 chunkSize = 20000; // 20KB chunks
        uint256 totalChunks = (contentBytes.length + chunkSize - 1) / chunkSize;

        console.log("   File:", fileName);
        console.log("   Size:", contentBytes.length, "bytes");
        console.log("   Chunks:", totalChunks);

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
            console.log("   Uploaded chunk", i + 1, "/", totalChunks);
        }

        // Freeze the content
        scriptyStorage.freezeContent(fileName);
        console.log("   Content", fileName, "uploaded and frozen");
    }

    function initializeSystem() internal {
        console.log("8. Initializing OnchainRugs system...");

        // Set Scripty contracts (includes HTML generator)
        RugAdminFacet(diamondAddr).setScriptyContracts(
            scriptyBuilderAddr,
            scriptyStorageAddr,
            htmlGeneratorAddr
        );

        // Note: New O(1) aging system uses hardcoded constants, not configurable thresholds
        // Test values use minutes instead of days for rapid testing
        console.log("   O(1) Aging System:");
        console.log("   - Dirt: 1min to 1, 2min to 2 (normally 3d to 1, 7d to 2)");
        console.log("   - Texture: 3min/level progression (normally 30dto60dto90dto120d...)");
        console.log("   - Free cleaning: 30min after mint, 11min after last clean");

        // Set pricing (0.00003 ETH base price, others 0)
        uint256[6] memory prices = [
            uint256(30000000000000), // basePrice: 0.00003 ETH in wei
            uint256(0),             // linePrice1
            uint256(0),             // linePrice2
            uint256(0),             // linePrice3
            uint256(0),             // linePrice4
            uint256(0)              // linePrice5
        ];
        RugAdminFacet(diamondAddr).updateMintPricing(prices);

        // Set collection parameters
        RugAdminFacet(diamondAddr).updateCollectionCap(10000);
        RugAdminFacet(diamondAddr).updateWalletLimit(7);

        // Set aging thresholds for test environment (minutes instead of days for rapid testing)
        // [dirt1, dirt2, texture1, texture2, freeCleanDays, freeCleanWindow] in minutes
        uint256[6] memory agingThresholds = [
            uint256(1 minutes),    // dirtLevel1Days: 1 minute to level 1
            uint256(2 minutes),    // dirtLevel2Days: 2 minutes to level 2
            uint256(6 minutes),    // textureLevel1Days: 6 minutes to start texture progression
            uint256(12 minutes),   // textureLevel2Days: 12 minutes for texture scaling
            uint256(1 minutes),    // freeCleanDays: 1 minute after mint for free cleaning
            uint256(30 seconds)    // freeCleanWindow: 30 seconds after cleaning for free cleaning
        ];
        RugAdminFacet(diamondAddr).updateAgingThresholds(agingThresholds);

        console.log("   System initialized with:");
        console.log("   - Base price: 0.00003 ETH");
        console.log("   - Collection cap: 10,000");
        console.log("   - Wallet limit: 7");
        console.log("   - Aging thresholds: 1min/2min dirt, 6min/12min texture, 1min free clean, 30sec window");
        console.log("   - Hybrid aging system: Natural + Neglect");
        console.log("   - Frame multipliers: Gold 50%, Platinum 67%, Diamond 75% slower");
        console.log("   - Dirt immunity: Silver+ frames");
        console.log("   - Scripty contracts configured");
    }

    // Selector generation functions
    function _getDiamondLoupeSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = DiamondLoupeFacet.facets.selector;
        selectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        selectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        selectors[3] = DiamondLoupeFacet.facetAddress.selector;
        selectors[4] = DiamondLoupeFacet.supportsInterface.selector;
        return selectors;
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](28);
        // ERC721 Standard Functions (hardcoded selectors from forge inspect)
        // Note: supportsInterface(bytes4) is already registered by DiamondLoupeFacet, so we skip it
        selectors[0] = bytes4(0x70a08231); // balanceOf(address)
        selectors[1] = bytes4(0x6352211e); // ownerOf(uint256)
        selectors[2] = bytes4(0x42842e0e); // safeTransferFrom(address,address,uint256)
        selectors[3] = bytes4(0x23b872dd); // transferFrom(address,address,uint256)
        selectors[4] = bytes4(0x095ea7b3); // approve(address,uint256)
        selectors[5] = bytes4(0xa22cb465); // setApprovalForAll(address,bool)
        selectors[6] = bytes4(0x081812fc); // getApproved(uint256)
        selectors[7] = bytes4(0xe985e9c5); // isApprovedForAll(address,address)
        selectors[8] = bytes4(0x06fdde03); // name()
        selectors[9] = bytes4(0x95d89b41); // symbol()
        selectors[10] = bytes4(0xc87b56dd); // tokenURI(uint256)
        selectors[11] = bytes4(0x18160ddd); // totalSupply()
        selectors[12] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)

        // Rug-specific functions
        selectors[13] = RugNFTFacet.mintRug.selector;             // 0f495d0c
        selectors[14] = RugNFTFacet.burn.selector;                // 42966c68
        selectors[15] = RugNFTFacet.getRugData.selector;          // 2e99fe3f
        selectors[16] = RugNFTFacet.getAgingData.selector;        // a8accc46
        selectors[17] = RugNFTFacet.getMintPrice.selector;        // 559e775b
        selectors[18] = RugNFTFacet.canMint.selector;             // c2ba4744
        selectors[19] = RugNFTFacet.isTextAvailable.selector;     // fdd9d9e8
        selectors[20] = RugNFTFacet.maxSupply.selector;           // d5abeb01
        selectors[21] = RugNFTFacet.walletMints.selector;         // f0293fd3
        selectors[22] = RugNFTFacet.isWalletException.selector;   // 2d2bf633
        selectors[23] = RugNFTFacet.getFrameLevel.selector;       // ceffb063
        selectors[24] = RugNFTFacet.updateFrameLevel.selector;    // 650def5b
        selectors[25] = RugNFTFacet.getFrameStatus.selector;      // b3e50020
        selectors[26] = RugNFTFacet.getMaintenanceHistory.selector; // 65b79c85
        selectors[27] = RugNFTFacet.getSaleHistory.selector;      // e05d541d

        return selectors;
    }

    function _getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](16);
        selectors[0] = RugAdminFacet.updateMintPricing.selector;
        selectors[1] = RugAdminFacet.updateCollectionCap.selector;
        selectors[2] = RugAdminFacet.updateWalletLimit.selector;
        selectors[3] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[4] = RugAdminFacet.getAgingThresholds.selector;
        selectors[5] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[6] = RugAdminFacet.setLaunchStatus.selector;
        selectors[7] = RugAdminFacet.getMintPricing.selector;
        selectors[8] = RugAdminFacet.getConfig.selector;
        selectors[9] = RugAdminFacet.setScriptyContracts.selector;
        selectors[10] = RugAdminFacet.addToExceptionList.selector;
        selectors[11] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[12] = RugAdminFacet.getExceptionList.selector;
        selectors[13] = RugAdminFacet.getServicePricing.selector;
        selectors[14] = RugAdminFacet.updateServicePricing.selector;
        selectors[15] = RugAdminFacet.isConfigured.selector;
        return selectors;
    }

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](11);
        selectors[0] = RugAgingFacet.getDirtLevel.selector;
        selectors[1] = RugAgingFacet.getTextureLevel.selector;
        selectors[2] = RugAgingFacet.getAgingState.selector;
        selectors[3] = RugAgingFacet.canClean.selector;
        selectors[4] = RugAgingFacet.canRestore.selector;
        selectors[5] = RugAgingFacet.isCleaningFree.selector;
        selectors[6] = RugAgingFacet.timeUntilNextDirt.selector;
        selectors[7] = RugAgingFacet.timeUntilNextTexture.selector;
        selectors[8] = RugAgingFacet.getAgingStats.selector;
        selectors[9] = RugAgingFacet.getProgressionInfo.selector;
        selectors[10] = RugAgingFacet.isWellMaintained.selector;
        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = bytes4(0x4f44b188); // cleanRug(uint256)
        selectors[1] = bytes4(0x9282303d); // restoreRug(uint256)
        selectors[2] = bytes4(0x0c19faf9); // masterRestoreRug(uint256)
        selectors[3] = bytes4(0x6c174ed8); // getCleaningCost(uint256)
        selectors[4] = bytes4(0x40a9c122); // getRestorationCost(uint256)
        selectors[5] = bytes4(0x234e4777); // getMasterRestorationCost(uint256)
        selectors[6] = bytes4(0x7eeafdbc); // getMaintenanceOptions(uint256)
        selectors[7] = bytes4(0x89d929be); // canCleanRug(uint256)
        selectors[8] = bytes4(0xf4fbfba0); // canRestoreRug(uint256)
        selectors[9] = bytes4(0x6c3075f2); // needsMasterRestoration(uint256)
        return selectors;
    }

    function _getRugCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = RugCommerceFacet.withdraw.selector;
        selectors[1] = RugCommerceFacet.withdrawTo.selector;
        selectors[2] = RugCommerceFacet.configureRoyalties.selector;
        selectors[3] = RugCommerceFacet.royaltyInfo.selector;
        selectors[4] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[5] = RugCommerceFacet.getBalance.selector;
        selectors[6] = RugCommerceFacet.getRoyaltyConfig.selector;
        selectors[7] = RugCommerceFacet.calculateRoyalty.selector;
        selectors[8] = RugCommerceFacet.getRoyaltyRecipients.selector;
        selectors[9] = RugCommerceFacet.areRoyaltiesConfigured.selector;
        return selectors;
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        selectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        selectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        selectors[4] = RugLaunderingFacet.getLaunderingSaleHistory.selector;
        selectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        selectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingStats.selector;
        return selectors;
    }
}
