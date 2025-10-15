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
 * @title DeployMinimalERC721C
 * @notice Minimal deployment script to test ERC721-C functionality with RugNFTFacet
 * @dev Deploys essential contracts for ERC721-C testing with full RugNFTFacet
 */
contract DeployMinimalERC721C is Script {

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Deploying RugNFT ERC721-C Test");
        console.log("=========================================");

        // Deploy diamond infrastructure
        console.log("1. Deploying Diamond infrastructure...");
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        Diamond diamond = new Diamond(deployer, address(diamondCutFacet));
        address diamondAddr = address(diamond);
        console.log("   Diamond deployed at:", diamondAddr);

        // Deploy facets
        console.log("2. Deploying RugNFT and ERC721-C facets...");
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
        console.log("RugNFT ERC721-C Test Deployment Complete!");
        console.log("=========================================");
        console.log("Diamond Contract:", diamondAddr);
        console.log("CreatorTokenTransferValidator: 0x721C008fdff27BF06E7E123956E2Fe03B63342e3");
        console.log("=========================================");
        console.log("Test Commands:");
        console.log("- Mint: RugNFTFacet(diamond).mintRug()");
        console.log("- Transfer: Test ERC721-C validation");
        console.log("- Check security: ERC721CFacet(diamond).getSecurityPolicy()");
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
        bytes4[] memory selectors = new bytes4[](14);
        selectors[0] = RugNFTFacet.mintRug.selector;
        selectors[1] = RugNFTFacet.burn.selector;
        selectors[2] = 0x70a08231; // balanceOf(address)
        selectors[3] = 0x6352211e; // ownerOf(uint256)
        selectors[4] = 0x42842e0e; // safeTransferFrom(address,address,uint256)
        selectors[5] = 0x23b872dd; // transferFrom(address,address,uint256)
        selectors[6] = 0x095ea7b3; // approve(address,uint256)
        selectors[7] = 0x17307eab; // setApprovalForAll(address,bool)
        selectors[8] = 0x081812fc; // getApproved(uint256)
        selectors[9] = 0xe985e9c5; // isApprovedForAll(address,address)
        selectors[10] = RugNFTFacet.name.selector;
        selectors[11] = RugNFTFacet.symbol.selector;
        selectors[12] = RugNFTFacet.tokenURI.selector;
        selectors[13] = RugNFTFacet.totalSupply.selector;
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
        // selectors[6] = RugTransferSecurityFacet.getTransferValidator.selector; // Duplicate with ERC721CFacet
        selectors[6] = RugTransferSecurityFacet.getSecurityPolicyId.selector;
        selectors[7] = RugTransferSecurityFacet.areTransfersEnforced.selector;
        selectors[8] = RugTransferSecurityFacet.isSecurityInitialized.selector;
        return selectors;
    }
}
