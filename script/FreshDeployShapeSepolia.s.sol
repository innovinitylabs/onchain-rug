// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
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
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title FreshDeployShapeSepolia
 * @notice Complete fresh deployment of OnchainRugs with ERC721-C on Shape Sepolia
 * @dev Deploys everything from scratch with proper ERC721-C integration
 */
contract FreshDeployShapeSepolia is Script {

    // Diamond and facets
    Diamond public diamond;
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;
    RugNFTFacet public rugNFTFacet;
    RugAdminFacet public rugAdminFacet;
    RugAgingFacet public rugAgingFacet;
    RugMaintenanceFacet public rugMaintenanceFacet;
    RugCommerceFacet public rugCommerceFacet;
    RugLaunderingFacet public rugLaunderingFacet;
    RugTransferSecurityFacet public rugTransferSecurityFacet;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=========================================");
        console.log("FRESH DEPLOY OnchainRugs ERC721-C to Shape Sepolia");
        console.log("=========================================");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Diamond infrastructure
        console.log("\nDeploying Diamond infrastructure...");
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();
        diamond = new Diamond(deployer, address(diamondCutFacet));
        console.log("Diamond deployed at:", address(diamond));

        // Deploy all Rug facets
        console.log("\nDeploying Rug facets...");
        rugNFTFacet = new RugNFTFacet();
        rugAdminFacet = new RugAdminFacet();
        rugAgingFacet = new RugAgingFacet();
        rugMaintenanceFacet = new RugMaintenanceFacet();
        rugCommerceFacet = new RugCommerceFacet();
        rugLaunderingFacet = new RugLaunderingFacet();
        rugTransferSecurityFacet = new RugTransferSecurityFacet();
        console.log("All facets deployed");

        // Configure Diamond with all facets
        console.log("\nConfiguring Diamond...");
        configureDiamond();

        // Initialize the system
        console.log("\nInitializing system...");
        initializeSystem();

        vm.stopBroadcast();

        console.log("\n=========================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("=========================================");
        console.log("Diamond Contract:", address(diamond));
        console.log("ERC721-C Ready: Transfers will be validated, mints are open");
        console.log("=========================================");
    }

    function configureDiamond() internal {
        // DiamondLoupeFacet
        IDiamondCut.FacetCut[] memory loupeCut = new IDiamondCut.FacetCut[](1);
        loupeCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getDiamondLoupeSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(loupeCut, address(0), "");
        console.log("  Added DiamondLoupeFacet");

        // RugNFTFacet
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugNFTSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(nftCut, address(0), "");
        console.log("  Added RugNFTFacet (ERC721-C enabled)");

        // RugAdminFacet
        IDiamondCut.FacetCut[] memory adminCut = new IDiamondCut.FacetCut[](1);
        adminCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAdminFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAdminSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(adminCut, address(0), "");
        console.log("  Added RugAdminFacet");

        // RugAgingFacet
        IDiamondCut.FacetCut[] memory agingCut = new IDiamondCut.FacetCut[](1);
        agingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugAgingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugAgingSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(agingCut, address(0), "");
        console.log("  Added RugAgingFacet");

        // RugMaintenanceFacet
        IDiamondCut.FacetCut[] memory maintenanceCut = new IDiamondCut.FacetCut[](1);
        maintenanceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugMaintenanceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugMaintenanceSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(maintenanceCut, address(0), "");
        console.log("  Added RugMaintenanceFacet");

        // RugCommerceFacet
        IDiamondCut.FacetCut[] memory commerceCut = new IDiamondCut.FacetCut[](1);
        commerceCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugCommerceFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugCommerceSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(commerceCut, address(0), "");
        console.log("  Added RugCommerceFacet");

        // RugLaunderingFacet
        IDiamondCut.FacetCut[] memory launderingCut = new IDiamondCut.FacetCut[](1);
        launderingCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugLaunderingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugLaunderingSelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(launderingCut, address(0), "");
        console.log("  Added RugLaunderingFacet");

        // RugTransferSecurityFacet
        IDiamondCut.FacetCut[] memory securityCut = new IDiamondCut.FacetCut[](1);
        securityCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugTransferSecurityFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugTransferSecuritySelectors()
        });
        IDiamondCut(address(diamond)).diamondCut(securityCut, address(0), "");
        console.log("  Added RugTransferSecurityFacet");
    }

    function initializeSystem() internal {
        address diamondAddr = address(diamond);

        // Initialize transfer security
        RugTransferSecurityFacet(diamondAddr).initializeTransferSecurity();
        console.log("  Initialized transfer security");

        // Set default security policy for royalty enforcement
        RugTransferSecurityFacet(diamondAddr).setToDefaultSecurityPolicy();
        console.log("  Set default ERC721-C security policy");
    }

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
        bytes4[] memory selectors = new bytes4[](29);
        // ERC721 functions
        selectors[0] = 0x70a08231; // balanceOf
        selectors[1] = 0x6352211e; // ownerOf
        selectors[2] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        selectors[3] = 0x23b872dd; // transferFrom
        selectors[4] = 0x095ea7b3; // approve
        selectors[5] = 0xa22cb465; // setApprovalForAll
        selectors[6] = 0x081812fc; // getApproved
        selectors[7] = 0xe985e9c5; // isApprovedForAll
        selectors[8] = 0x06fdde03; // name
        selectors[9] = 0x95d89b41; // symbol
        selectors[10] = 0xc87b56dd; // tokenURI
        selectors[11] = 0x18160ddd; // totalSupply
        selectors[12] = 0xb88d4fde; // safeTransferFrom(address,address,uint256,bytes)

        // Rug-specific functions
        selectors[13] = RugNFTFacet.mintRug.selector;
        selectors[14] = RugNFTFacet.burn.selector;
        selectors[15] = RugNFTFacet.getRugData.selector;
        selectors[16] = RugNFTFacet.getAgingData.selector;
        selectors[17] = RugNFTFacet.getMintPrice.selector;
        selectors[18] = RugNFTFacet.canMint.selector;
        selectors[19] = RugNFTFacet.isTextAvailable.selector;
        selectors[20] = RugNFTFacet.maxSupply.selector;
        selectors[21] = RugNFTFacet.walletMints.selector;
        selectors[22] = RugNFTFacet.isWalletException.selector;

        // ERC721-C functions
        selectors[23] = RugNFTFacet.getTransferValidator.selector;
        selectors[24] = RugNFTFacet.getSecurityPolicy.selector;
        selectors[25] = RugNFTFacet.getWhitelistedOperators.selector;
        selectors[26] = RugNFTFacet.getPermittedContractReceivers.selector;
        selectors[27] = RugNFTFacet.isTransferAllowed.selector;
        selectors[28] = 0x01ffc9a7; // supportsInterface

        return selectors;
    }

    function _getRugAdminSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](17);
        selectors[0] = RugAdminFacet.updateCollectionCap.selector;
        selectors[1] = RugAdminFacet.updateWalletLimit.selector;
        selectors[2] = RugAdminFacet.updateMintPricing.selector;
        selectors[3] = RugAdminFacet.updateServicePricing.selector;
        selectors[4] = RugAdminFacet.updateAgingThresholds.selector;
        selectors[5] = RugAdminFacet.updateFrameThresholds.selector;
        selectors[6] = RugAdminFacet.addToExceptionList.selector;
        selectors[7] = RugAdminFacet.removeFromExceptionList.selector;
        selectors[8] = RugAdminFacet.setLaunderingEnabled.selector;
        selectors[9] = RugAdminFacet.setLaunchStatus.selector;
        selectors[10] = RugAdminFacet.getConfig.selector;
        selectors[11] = RugAdminFacet.getMintPricing.selector;
        selectors[12] = RugAdminFacet.getServicePricing.selector;
        selectors[13] = RugAdminFacet.getAgingThresholds.selector;
        selectors[14] = RugAdminFacet.getExceptionList.selector;
        selectors[15] = RugAdminFacet.setScriptyContracts.selector;
        selectors[16] = RugAdminFacet.isConfigured.selector;
        return selectors;
    }

    function _getRugAgingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = RugAgingFacet.cleanRug.selector;
        selectors[1] = RugAgingFacet.getDirtLevel.selector;
        selectors[2] = RugAgingFacet.getTextureLevel.selector;
        selectors[3] = RugAgingFacet.getFrameLevel.selector;
        selectors[4] = RugAgingFacet.getAgingLevel.selector;
        selectors[5] = RugAgingFacet.getFrameStatus.selector;
        selectors[6] = RugAgingFacet.getAgingStatus.selector;
        selectors[7] = RugAgingFacet.getNextMaintenanceTime.selector;
        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](12);
        selectors[0] = RugMaintenanceFacet.maintainRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreTexture.selector;
        selectors[2] = RugMaintenanceFacet.masterRestore.selector;
        selectors[3] = RugMaintenanceFacet.getMaintenanceCost.selector;
        selectors[4] = RugMaintenanceFacet.getTextureCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestoreCost.selector;
        selectors[6] = RugMaintenanceFacet.getMaintenanceHistory.selector;
        selectors[7] = RugMaintenanceFacet.getSaleHistory.selector;
        selectors[8] = RugMaintenanceFacet.getMaintenanceStats.selector;
        selectors[9] = RugMaintenanceFacet.getLastMaintenanceTime.selector;
        selectors[10] = RugMaintenanceFacet.canMaintain.selector;
        selectors[11] = RugMaintenanceFacet.getMaintenanceLevel.selector;
        return selectors;
    }

    function _getRugCommerceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](10);
        selectors[0] = RugCommerceFacet.configureRoyalties.selector;
        selectors[1] = RugCommerceFacet.distributeRoyalties.selector;
        selectors[2] = RugCommerceFacet.withdrawRoyalties.selector;
        selectors[3] = RugCommerceFacet.getRoyaltyInfo.selector;
        selectors[4] = RugCommerceFacet.getCollectionRoyalties.selector;
        selectors[5] = RugCommerceFacet.getTokenRoyalties.selector;
        selectors[6] = RugCommerceFacet.setPricingBounds.selector;
        selectors[7] = RugCommerceFacet.getPricingBounds.selector;
        selectors[8] = RugCommerceFacet.setApprovedPaymentCoin.selector;
        selectors[9] = RugCommerceFacet.getApprovedPaymentCoin.selector;
        return selectors;
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = RugLaunderingFacet.launderRug.selector;
        selectors[1] = RugLaunderingFacet.getLaunderingCost.selector;
        selectors[2] = RugLaunderingFacet.getLaunderingStats.selector;
        selectors[3] = RugLaunderingFacet.getTimeUntilLaunderable.selector;
        selectors[4] = RugLaunderingFacet.canLaunder.selector;
        selectors[5] = RugLaunderingFacet.getLaunderingLevel.selector;
        selectors[6] = RugLaunderingFacet.getLastLaunderedTime.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingHistory.selector;
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
        selectors[6] = RugTransferSecurityFacet.getSecurityPolicyId.selector;
        selectors[7] = RugTransferSecurityFacet.areTransfersEnforced.selector;
        selectors[8] = RugTransferSecurityFacet.isSecurityInitialized.selector;
        return selectors;
    }
}
