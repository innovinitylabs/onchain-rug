// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/Diamond.sol";
import "../src/diamond/facets/DiamondCutFacet.sol";
import "../src/diamond/facets/DiamondLoupeFacet.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/ERC721CFacet.sol";
import "../src/facets/RugTransferSecurityFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title DeployFullRug
 * @notice Deploy full OnchainRugs with ERC721-C integration
 * @dev Deploys the complete rug system with ERC721-C transfer validation
 */
contract DeployFullRug is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Deploying Full OnchainRugs with ERC721-C");
        console.log("=========================================");

        // Deploy diamond infrastructure
        console.log("1. Deploying Diamond infrastructure...");
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        Diamond diamond = new Diamond(deployer, address(diamondCutFacet));
        address diamondAddr = address(diamond);
        console.log("   Diamond deployed at:", diamondAddr);

        // Deploy facets
        console.log("2. Deploying Rug facets...");
        RugNFTFacet rugNFTFacet = new RugNFTFacet();
        ERC721CFacet erc721CFacet = new ERC721CFacet();
        RugTransferSecurityFacet transferSecurityFacet = new RugTransferSecurityFacet();
        console.log("   Facets deployed");

        // Configure diamond
        console.log("3. Configuring Diamond...");

        // Add DiamondLoupeFacet
        IDiamondCut.FacetCut[] memory loupeCut = new IDiamondCut.FacetCut[](1);
        loupeCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getDiamondLoupeSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(loupeCut, address(0), "");
        console.log("   Added DiamondLoupeFacet");

        // Add RugNFTFacet
        IDiamondCut.FacetCut[] memory nftCut = new IDiamondCut.FacetCut[](1);
        nftCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getRugNFTSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(nftCut, address(0), "");
        console.log("   Added RugNFTFacet");

        // Add ERC721CFacet
        IDiamondCut.FacetCut[] memory erc721cCut = new IDiamondCut.FacetCut[](1);
        erc721cCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(erc721CFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getERC721CSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(erc721cCut, address(0), "");
        console.log("   Added ERC721CFacet");

        // Add TransferSecurityFacet
        IDiamondCut.FacetCut[] memory securityCut = new IDiamondCut.FacetCut[](1);
        securityCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(transferSecurityFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getTransferSecuritySelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(securityCut, address(0), "");
        console.log("   Added TransferSecurityFacet");

        // Initialize transfer security
        console.log("4. Initializing ERC721-C transfer security...");
        RugTransferSecurityFacet(diamondAddr).initializeTransferSecurity();
        console.log("   ERC721-C transfer security initialized");

        vm.stopBroadcast();

        console.log("=========================================");
        console.log("Full OnchainRugs ERC721-C Deployment Complete!");
        console.log("=========================================");
        console.log("Diamond Contract:", diamondAddr);
        console.log("CreatorTokenTransferValidator: 0x721C008fdff27BF06E7E123956E2Fe03B63342e3");
        console.log("=========================================");
        console.log("Test Commands:");
        console.log("- Mint rug: RugNFTFacet(diamond).mintRug([\"HELLO\"], 123)");
        console.log("- Check security: ERC721CFacet(diamond).getSecurityPolicy()");
        console.log("- Transfer validation: Try transferring NFTs");
        console.log("=========================================");
    }

    function _getDiamondLoupeSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = 0x7a0ed627; // facets()
        selectors[1] = 0xadfca15e; // facetFunctionSelectors(address)
        selectors[2] = 0x52ef6b2c; // facetAddresses()
        selectors[3] = 0xcdffacc6; // facetAddress(bytes4)
        selectors[4] = 0x01ffc9a7; // supportsInterface(bytes4)
        return selectors;
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](20);
        selectors[0] = RugNFTFacet.mintRug.selector;
        selectors[1] = RugNFTFacet.burn.selector;
        selectors[2] = RugNFTFacet.getRugData.selector;
        selectors[3] = RugNFTFacet.getAgingData.selector;
        selectors[4] = RugNFTFacet.totalSupply.selector;
        selectors[5] = RugNFTFacet.maxSupply.selector;
        selectors[6] = RugNFTFacet.isTextAvailable.selector;
        selectors[7] = RugNFTFacet.getMintPrice.selector;
        selectors[8] = RugNFTFacet.canMint.selector;
        selectors[9] = RugNFTFacet.walletMints.selector;
        selectors[10] = RugNFTFacet.isWalletException.selector;
        selectors[11] = RugNFTFacet.tokenURI.selector;
        // ERC721 standard functions
        selectors[12] = 0x70a08231; // balanceOf(address)
        selectors[13] = 0x6352211e; // ownerOf(uint256)
        selectors[14] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        selectors[15] = 0x23b872dd; // transferFrom(address,address,uint256)
        selectors[16] = 0x095ea7b3; // approve(address,uint256)
        selectors[17] = 0x06fdde03; // name()
        selectors[18] = 0x95d89b41; // symbol()
        selectors[19] = 0x01ffc9a7; // supportsInterface(bytes4)
        return selectors;
    }

    function _getERC721CSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](9);
        selectors[0] = ERC721CFacet.getTransferValidator.selector;
        selectors[1] = ERC721CFacet.getSecurityPolicy.selector;
        selectors[2] = ERC721CFacet.getWhitelistedOperators.selector;
        selectors[3] = ERC721CFacet.getPermittedContractReceivers.selector;
        selectors[4] = ERC721CFacet.isOperatorWhitelisted.selector;
        selectors[5] = ERC721CFacet.isContractReceiverPermitted.selector;
        selectors[6] = ERC721CFacet.isTransferAllowed.selector;
        selectors[7] = ERC721CFacet.validateTransfer.selector;
        selectors[8] = ERC721CFacet.supportsERC721CInterface.selector;
        return selectors;
    }

    function _getTransferSecuritySelectors() internal pure returns (bytes4[] memory) {
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
