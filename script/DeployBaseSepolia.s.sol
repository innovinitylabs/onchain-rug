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
import "../src/facets/RugTransferSecurityFacet.sol";
import "../src/facets/RugMarketplaceFacet.sol";
import "../src/DiamondFramePool.sol";
import "../src/libraries/LibRugStorage.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Base Sepolia Deployment Script - X402 Integration
 * @dev Fresh deployment to Base Sepolia for X402 monetization
 * @notice Deploys all contracts from scratch without any dependencies
 */
contract DeployBaseSepolia is Script {
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
    RugTransferSecurityFacet public rugTransferSecurityFacet;
    RugMarketplaceFacet public rugMarketplaceFacet;
    DiamondFramePool public diamondFramePool;

    // Deployment addresses
    address public fileStoreAddr;
    address public scriptyStorageAddr;
    address public scriptyBuilderAddr;
    address public htmlGeneratorAddr;
    address public diamondAddr;
    address public poolAddr;

    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;
    uint256 constant DAY = 1 days;

    function setUp() public {
        // Try TESTNET_PRIVATE_KEY first, fallback to PRIVATE_KEY
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
    }

    // ===== CONFIGURABLE SETTINGS (via environment variables) =====
    // These can be overridden by setting environment variables before deployment
    
    function getRoyaltyPercentage() internal view returns (uint256) {
        // Default: 10% (1000 basis points)
        // Can be set via ROYALTY_PERCENTAGE env var (in basis points)
        // NOTE: This is the TOTAL royalty that includes curator + creator + pool
        // - Curator: 1% (100 basis points, hardcoded)
        // - Pool: Configurable via POOL_PERCENTAGE (default 1%)
        // - Creator: Remaining (ROYALTY_PERCENTAGE - 100 - POOL_PERCENTAGE)
        try vm.envUint("ROYALTY_PERCENTAGE") returns (uint256 percentage) {
            require(percentage <= 10000, "Royalty percentage too high");
            require(percentage >= 200, "Royalty percentage too low (must be at least 2% for curator + pool)");
            return percentage;
        } catch {
            return 1000; // 10% default (1% curator + 8% creator + 1% pool)
        }
    }

    function getCuratorRoyaltyBPS() internal pure returns (uint256) {
        // Curator royalty is hardcoded to 1% (100 basis points)
        // This goes to the address that minted the NFT (stored in RugData.curator)
        // NOT configurable - fixed at 1%
        return 100; // 1%
    }

    function getMarketplaceFeeBPS() internal view returns (uint256) {
        // Default: 0% (0 basis points)
        // Can be set via MARKETPLACE_FEE_BPS env var (in basis points)
        try vm.envUint("MARKETPLACE_FEE_BPS") returns (uint256 fee) {
            require(fee <= 10000, "Marketplace fee too high");
            return fee;
        } catch {
            return 0; // 0% default
        }
    }

    function getPoolPercentage() internal view returns (uint256) {
        // Default: 1% (100 basis points)
        // Can be set via POOL_PERCENTAGE env var (in basis points)
        // This is the percentage of royalties that go to the Diamond Frame Pool
        // NOTE: This is part of the total ROYALTY_PERCENTAGE
        try vm.envUint("POOL_PERCENTAGE") returns (uint256 percentage) {
            require(percentage <= 10000, "Pool percentage too high");
            return percentage;
        } catch {
            return 100; // 1% default
        }
    }

    function getMinimumClaimableAmount() internal view returns (uint256) {
        // Default: 0.0001 ETH
        // Can be set via MINIMUM_CLAIMABLE_AMOUNT env var (in wei)
        try vm.envUint("MINIMUM_CLAIMABLE_AMOUNT") returns (uint256 amount) {
            return amount;
        } catch {
            return 0.0001 ether; // 0.0001 ETH default
        }
    }

    function getBasePrice() internal view returns (uint256) {
        // Default: 0.00003 ETH
        // Can be set via BASE_PRICE env var (in wei)
        try vm.envUint("BASE_PRICE") returns (uint256 price) {
            return price;
        } catch {
            return 30000000000000; // 0.00003 ETH default
        }
    }

    function getCollectionCap() internal view returns (uint256) {
        // Default: 10000
        // Can be set via COLLECTION_CAP env var
        try vm.envUint("COLLECTION_CAP") returns (uint256 cap) {
            return cap;
        } catch {
            return 10000; // 10000 default
        }
    }

    function getWalletLimit() internal view returns (uint256) {
        // Default: 10
        // Can be set via WALLET_LIMIT env var
        try vm.envUint("WALLET_LIMIT") returns (uint256 limit) {
            return limit;
        } catch {
            return 10; // 10 default
        }
    }

    function getServiceFee() internal view returns (uint256) {
        // Default: 0.00042 ETH
        // Can be set via SERVICE_FEE env var (in wei)
        try vm.envUint("SERVICE_FEE") returns (uint256 fee) {
            return fee;
        } catch {
            return 0.00042 ether; // 0.00042 ETH default
        }
    }

    function run() public {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Starting OnchainRugs Base Sepolia Deployment");
        console.log("=========================================");

        deployInfrastructure();
        deployDiamond();
        configureDiamond();
        deployPool();
        configurePool();
        uploadLibraries();
        initializeSystem();

        console.log("=========================================");
        console.log("Base Sepolia Deployment Complete!");
        console.log("=========================================");
        console.log("FileStore:", fileStoreAddr);
        console.log("ScriptyStorageV2:", scriptyStorageAddr);
        console.log("ScriptyBuilderV2:", scriptyBuilderAddr);
        console.log("HTMLGenerator:", htmlGeneratorAddr);
        console.log("Diamond:", diamondAddr);
        console.log("DiamondFramePool:", poolAddr);
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function deployInfrastructure() internal {
        console.log("1. Deploying FileStore...");
        // For Base Sepolia, we'll use a simple deployer address
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
        rugTransferSecurityFacet = new RugTransferSecurityFacet();
        rugMarketplaceFacet = new RugMarketplaceFacet();
        console.log("   All Rug facets deployed (including Transfer Security and Marketplace)");
    }

    function deployPool() internal {
        console.log("9. Deploying Diamond Frame Pool...");

        // Deploy the pool contract with diamond address and minimum claimable amount
        uint256 minimumClaimableAmount = getMinimumClaimableAmount();
        diamondFramePool = new DiamondFramePool(diamondAddr, minimumClaimableAmount);
        poolAddr = address(diamondFramePool);
        console.log("   DiamondFramePool deployed at:", poolAddr);
        console.log("   Minimum claimable amount:", minimumClaimableAmount / 1e18, "ETH");
    }

    function configurePool() internal {
        console.log("10. Configuring Diamond Frame Pool...");

        // Pool ownership is set in constructor, no need to transfer
        console.log("   Pool ownership set to diamond contract in constructor");

        // Configure the pool in the diamond contract
        uint256 poolPercentage = getPoolPercentage();
        RugCommerceFacet(diamondAddr).setPoolContract(poolAddr);
        RugCommerceFacet(diamondAddr).setPoolPercentage(poolPercentage);
        console.log("   Pool configured in diamond contract");
        console.log("   Pool percentage:", poolPercentage, "basis points (", poolPercentage / 100, "%)");
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
        console.log("   Added RugNFTFacet with all ERC721 functions (includes ERC721-C validation)");

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

        // Add RugTransferSecurityFacet
        IDiamondCut.FacetCut[] memory transferSecurityCut = new IDiamondCut.FacetCut[](1);
        transferSecurityCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugTransferSecurityFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugTransferSecuritySelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(transferSecurityCut, address(0), "");
        console.log("   Added RugTransferSecurityFacet");

        // Add RugMarketplaceFacet
        IDiamondCut.FacetCut[] memory marketplaceCut = new IDiamondCut.FacetCut[](1);
        marketplaceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMarketplaceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugMarketplaceSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(marketplaceCut, address(0), "");
        console.log("   Added RugMarketplaceFacet");
    }

    function uploadLibraries() internal {
        console.log("7. Uploading JavaScript libraries to ScriptyStorage...");

        // Upload rug-p5.js
        string memory p5Content = vm.readFile("data/rug-p5.js");
        uploadFile("rug-p5.js", p5Content);

        // Upload rug-algo.js
        string memory algoContent = vm.readFile("data/rug-algo.js");
        uploadFile("rug-algo.js", algoContent);

        // Upload rug-frame.js
        string memory frameContent = vm.readFile("data/rug-frame.js");
        uploadFile("rug-frame.js", frameContent);

        console.log("   All libraries uploaded successfully");
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

        // Initialize ERC721 metadata (name and symbol)
        console.log("   Initializing ERC721 metadata...");
        RugNFTFacet(diamondAddr).initializeERC721Metadata();
        console.log("   Name: OnchainRugs, Symbol: RUGS");

        // Set Scripty contracts (includes HTML generator)
        RugAdminFacet(diamondAddr).setScriptyContracts(
            scriptyBuilderAddr,
            scriptyStorageAddr,
            htmlGeneratorAddr
        );

        // ERC721-C transfer security already initialized in RugNFTFacet constructor
        console.log("   ERC721-C transfer validator initialized in RugNFTFacet");

        // Marketplace uses default configuration (no initialization needed)

        // Note: New O(1) aging system uses hardcoded constants, not configurable thresholds
        // Test values use minutes instead of days for rapid testing
        console.log("   O(1) Aging System:");
        console.log("   - Dirt: 1min to 1, 2min to 2 (normally 3d to 1, 7d to 2)");
        console.log("   - Texture: 3min/level progression (normally 30dto60dto90dto120d...)");
        console.log("   - Free cleaning: 30min after mint, 11min after last clean");

        // Set pricing (configurable via BASE_PRICE env var)
        uint256 basePrice = getBasePrice();
        uint256[6] memory prices = [
            basePrice,              // basePrice: configurable
            uint256(0),             // linePrice1
            uint256(0),             // linePrice2
            uint256(0),             // linePrice3
            uint256(0),             // linePrice4
            uint256(0)              // linePrice5
        ];
        RugAdminFacet(diamondAddr).updateMintPricing(prices);

        // Set collection parameters (configurable via env vars)
        uint256 collectionCap = getCollectionCap();
        uint256 walletLimit = getWalletLimit();
        RugAdminFacet(diamondAddr).updateCollectionCap(collectionCap);
        RugAdminFacet(diamondAddr).updateWalletLimit(walletLimit);

        // Add deployer to exception list (no wallet limits)
        address deployer = LibDiamond.contractOwner();
        RugAdminFacet(diamondAddr).addToExceptionList(deployer);

        // Set aging thresholds for fresh mechanics system (test values in minutes)
        // [dirtLevel1Minutes, dirtLevel2Minutes, agingAdvanceMinutes, freeCleanMinutes, freeCleanWindowMinutes]
        uint256[5] memory agingThresholds = [
            uint256(1 minutes),    // dirtLevel1: 1 minute to level 1 (normally 1 day)
            uint256(2 minutes),    // dirtLevel2: 2 minutes to level 2 (normally 3 days)
            uint256(3 minutes),    // agingAdvance: 3 minutes between aging level advances (normally 7 days)
            uint256(5 minutes),    // freeClean: 5 minutes after mint for free cleaning (normally 14 days)
            uint256(2 minutes)     // freeCleanWindow: 2 minutes after cleaning for free cleaning (normally 5 days)
        ];
        RugAdminFacet(diamondAddr).updateAgingThresholds(agingThresholds);

        // Set service pricing [cleaningCost, restorationCost, masterRestorationCost, launderingThreshold]
        uint256[4] memory servicePrices = [
            uint256(0.00001 ether),  // cleaningCost
            uint256(0.00001 ether),  // restorationCost
            uint256(0.00001 ether),  // masterRestorationCost
            uint256(0.00001 ether)   // launderingThreshold
        ];
        RugAdminFacet(diamondAddr).updateServicePricing(servicePrices);

        // Set frame progression thresholds (higher = harder to achieve)
        uint256[4] memory frameThresholds = [
            uint256(50),   // bronzeThreshold: 50 points
            uint256(150),  // silverThreshold: 150 points
            uint256(300),  // goldThreshold: 300 points
            uint256(600)   // diamondThreshold: 600 points
        ];
        RugAdminFacet(diamondAddr).updateFrameThresholds(frameThresholds);

        console.log("   System initialized with:");
        console.log("   - Base price:", basePrice / 1e18, "ETH");
        console.log("   - Collection cap:", collectionCap);
        console.log("   - Wallet limit:", walletLimit, "NFTs per wallet");
        console.log("   - Aging thresholds (TEST VALUES): 1min/2min dirt, 3min aging progression");
        console.log("   - Free cleaning: 5min after mint, 2min after cleaning");
        console.log("   - Service costs: 0.00001 ETH each");
        console.log("   - Frame thresholds: Bronze(50), Silver(150), Gold(300), Diamond(600)");
        console.log("   - Aging protection: Bronze(25% slower), Silver(50%), Gold(80%), Diamond(90%)");
        console.log("   - Dirt immunity: Silver+ frames never accumulate dirt");
        console.log("   - Maintenance points: Clean(2), Restore(8), Master(12), Launder(20)");
        console.log("   - Fresh mechanics: 3 dirt levels, 11 aging levels, 5 frames");
        console.log("   - Scripty contracts configured");

        // Configure royalties (configurable via ROYALTY_PERCENTAGE env var)
        // NOTE: ROYALTY_PERCENTAGE is the TOTAL royalty that includes:
        // - Curator (Minter): 1% (hardcoded, not configurable)
        // - Pool: Configurable via POOL_PERCENTAGE (default 1%)
        // - Creator: Remaining amount (ROYALTY_PERCENTAGE - Curator - Pool)
        console.log("   Configuring royalties...");
        uint256 royaltyPercentage = getRoyaltyPercentage();
        uint256 poolPercentage = getPoolPercentage();
        uint256 curatorRoyaltyBPS = 100; // Hardcoded to 1% (100 basis points) - not configurable
        uint256 creatorRoyaltyBPS = royaltyPercentage - curatorRoyaltyBPS - poolPercentage;
        
        address[] memory recipients = new address[](1);
        recipients[0] = deployer; // Deployer's address

        uint256[] memory recipientSplits = new uint256[](1);
        recipientSplits[0] = creatorRoyaltyBPS; // Creator gets remaining after curator and pool

        RugCommerceFacet(diamondAddr).configureRoyalties(
            royaltyPercentage, // Total royalty percentage (in basis points)
            recipients,
            recipientSplits
        );
        console.log("   - Total Royalties:", royaltyPercentage, "basis points (", royaltyPercentage / 100, "%)");
        console.log("   - Breakdown:");
        console.log("     * Creator:", creatorRoyaltyBPS, "basis points (", creatorRoyaltyBPS / 100, "%) to deployer");
        console.log("     * Curator (Minter):", curatorRoyaltyBPS, "basis points (", curatorRoyaltyBPS / 100, "%) - hardcoded, goes to minter");
        console.log("     * Pool:", poolPercentage, "basis points (", poolPercentage / 100, "%)");

        // Enable laundering by default
        console.log("   Enabling automatic laundering...");
        RugAdminFacet(diamondAddr).setLaunderingEnabled(true);
        console.log("   - Automatic laundering: ENABLED");

        // Configure marketplace fee (configurable via MARKETPLACE_FEE_BPS env var)
        console.log("   Configuring marketplace fee...");
        uint256 marketplaceFeeBPS = getMarketplaceFeeBPS();
        RugMarketplaceFacet(diamondAddr).setMarketplaceFee(marketplaceFeeBPS);
        console.log("   - Marketplace fee:", marketplaceFeeBPS, "basis points (", marketplaceFeeBPS / 100, "%)");

        // Configure x402 AI maintenance fees (configurable via SERVICE_FEE env var)
        console.log("   Configuring x402 AI maintenance fees...");
        RugAdminFacet(diamondAddr).setFeeRecipient(deployer);
        uint256 serviceFee = getServiceFee();
        RugAdminFacet(diamondAddr).setServiceFee(serviceFee);
        // Set AI service fee for X402 monetization (set to 0 for now - can be enabled later)
        uint256 aiServiceFee = 0 ether; // AI service fee for maintenance operations (disabled)
        RugAdminFacet(diamondAddr).updateAIServiceFee(aiServiceFee);
        console.log("   - Fee recipient: deployer address");
        console.log("   - Flat service fee:", serviceFee / 1e18, "ETH for all actions");
        console.log("   - AI service fee: 0 ETH (disabled)");
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
        bytes4[] memory selectors = new bytes4[](32);
        // ERC721 Standard Functions (hardcoded selectors from forge inspect)
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
        selectors[13] = RugNFTFacet.mintRug.selector;
        selectors[14] = RugNFTFacet.mintRugFor.selector; // NEW: Cross-chain mint for Relay
        selectors[15] = RugNFTFacet.burn.selector;
        selectors[16] = RugNFTFacet.getRugData.selector;
        selectors[17] = RugNFTFacet.getAgingData.selector;
        selectors[18] = RugNFTFacet.getMintPrice.selector;
        selectors[19] = RugNFTFacet.canMint.selector;
        selectors[20] = RugNFTFacet.isTextAvailable.selector;
        selectors[21] = RugNFTFacet.maxSupply.selector;
        selectors[22] = RugNFTFacet.walletMints.selector;
        selectors[23] = RugNFTFacet.isWalletException.selector;

        // ERC721-C functions
        selectors[24] = RugNFTFacet.getTransferValidator.selector;
        selectors[25] = RugNFTFacet.getSecurityPolicy.selector;
        selectors[26] = RugNFTFacet.getWhitelistedOperators.selector;
        selectors[27] = RugNFTFacet.getPermittedContractReceivers.selector;
        selectors[28] = RugNFTFacet.isOperatorWhitelisted.selector;
        selectors[29] = RugNFTFacet.isContractReceiverPermitted.selector;
        selectors[30] = RugNFTFacet.isTransferAllowed.selector;

        // Initialization function
        selectors[31] = RugNFTFacet.initializeERC721Metadata.selector;

        return selectors;
    }


    function _getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](23);
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
        selectors[15] = RugAdminFacet.updateFrameThresholds.selector;
        selectors[16] = RugAdminFacet.updateAIServiceFee.selector;
        selectors[17] = RugAdminFacet.isConfigured.selector;
        selectors[18] = RugAdminFacet.setServiceFee.selector;
        selectors[19] = RugAdminFacet.setFeeRecipient.selector;
        selectors[20] = RugAdminFacet.getAgentServiceFee.selector;
        selectors[21] = RugAdminFacet.setERC721Metadata.selector;
        return selectors;
    }

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = RugAgingFacet.getDirtLevel.selector;
        selectors[1] = RugAgingFacet.getAgingLevel.selector;
        selectors[2] = RugAgingFacet.getFrameLevel.selector;
        selectors[3] = RugAgingFacet.getFrameName.selector;
        selectors[4] = RugAgingFacet.getMaintenanceScore.selector;
        selectors[5] = RugAgingFacet.hasDirt.selector;
        selectors[6] = RugAgingFacet.isCleaningFree.selector;
        selectors[7] = RugAgingFacet.timeUntilNextAging.selector;
        selectors[8] = RugAgingFacet.timeUntilNextDirt.selector;
        selectors[9] = RugAgingFacet.getAgingState.selector;
        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](19);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.canCleanRug.selector;
        selectors[7] = RugMaintenanceFacet.canRestoreRug.selector;
        selectors[8] = RugMaintenanceFacet.needsMasterRestoration.selector;
        selectors[9] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        selectors[10] = RugMaintenanceFacet.getMaintenanceHistory.selector;
        // Agent authorization + agent entrypoints
        selectors[11] = RugMaintenanceFacet.authorizeMaintenanceAgent.selector;
        selectors[12] = RugMaintenanceFacet.revokeMaintenanceAgent.selector;
        selectors[13] = RugMaintenanceFacet.cleanRugAgent.selector;
        selectors[14] = RugMaintenanceFacet.restoreRugAgent.selector;
        selectors[15] = RugMaintenanceFacet.masterRestoreRugAgent.selector;
        // Agent management functions
        selectors[16] = RugMaintenanceFacet.getAuthorizedAgents.selector;
        selectors[17] = RugMaintenanceFacet.getAuthorizedAgentsFor.selector;
        selectors[18] = RugMaintenanceFacet.isAgentAuthorized.selector;
        return selectors;
    }

    function _getRugCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](23);
        // Original selectors
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
        // Payment Processor integration selectors
        selectors[10] = RugCommerceFacet.setCollectionPricingBounds.selector;
        selectors[11] = RugCommerceFacet.setTokenPricingBounds.selector;
        selectors[12] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        selectors[13] = RugCommerceFacet.getCollectionPricingBounds.selector;
        selectors[14] = RugCommerceFacet.getTokenPricingBounds.selector;
        selectors[15] = RugCommerceFacet.isCollectionPricingImmutable.selector;
        selectors[16] = RugCommerceFacet.isTokenPricingImmutable.selector;
        selectors[17] = RugCommerceFacet.getApprovedPaymentCoin.selector;
        selectors[18] = RugCommerceFacet.getSaleHistory.selector;
        // Diamond Frame Pool selectors
        selectors[19] = RugCommerceFacet.setPoolContract.selector;
        selectors[20] = RugCommerceFacet.setPoolPercentage.selector;
        selectors[21] = RugCommerceFacet.getPoolConfig.selector;
        selectors[22] = RugCommerceFacet.emergencyWithdrawFromPool.selector;
        // Note: supportsInterface(bytes4) is already registered by DiamondLoupeFacet
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

    function _getRugTransferSecuritySelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = RugTransferSecurityFacet.initializeTransferSecurity.selector;
        selectors[1] = RugTransferSecurityFacet.setTransferValidator.selector;
        selectors[2] = RugTransferSecurityFacet.setToDefaultSecurityPolicy.selector;
        selectors[3] = RugTransferSecurityFacet.setToCustomSecurityPolicy.selector;
        selectors[4] = RugTransferSecurityFacet.setPaymentProcessorSecurityPolicy.selector;
        selectors[5] = RugTransferSecurityFacet.setTransferEnforcement.selector;
        // selectors[6] = RugTransferSecurityFacet.getTransferValidator.selector; // Now in RugNFTFacet
        selectors[6] = RugTransferSecurityFacet.getSecurityPolicyId.selector;
        selectors[7] = RugTransferSecurityFacet.areTransfersEnforced.selector;
        selectors[8] = RugTransferSecurityFacet.isSecurityInitialized.selector;
        return selectors;
    }

    function _getRugMarketplaceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        // Listing functions
        selectors[0] = RugMarketplaceFacet.createListing.selector;
        selectors[1] = RugMarketplaceFacet.cancelListing.selector;
        selectors[2] = RugMarketplaceFacet.updateListingPrice.selector;
        selectors[3] = RugMarketplaceFacet.buyListing.selector;
        // Admin functions
        selectors[4] = RugMarketplaceFacet.setMarketplaceFee.selector;
        selectors[5] = RugMarketplaceFacet.withdrawFees.selector;
        // View functions
        selectors[6] = RugMarketplaceFacet.getListing.selector;
        selectors[7] = RugMarketplaceFacet.getMarketplaceStats.selector;
        return selectors;
    }
}

