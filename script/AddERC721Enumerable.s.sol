// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";

// Import the diamond pattern
import "../src/diamond/interfaces/IDiamondCut.sol";

// Import the facets to upgrade
import "../src/facets/RugNFTFacet.sol";

contract AddERC721Enumerable is Script {
    // Configuration
    address public deployer;
    uint256 public deployerPrivateKey;
    address public diamondAddr;

    // Facet addresses
    RugNFTFacet public nftFacet;

    function setUp() external {
        // Load private key
        try vm.envUint("TESTNET_PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);

        // Load diamond address from env or use default
        try vm.envAddress("NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT") returns (address addr) {
            diamondAddr = addr;
        } catch {
            // Default to Shape Sepolia if not set
            diamondAddr = 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325;
        }
        console.log("Upgrading diamond at:", diamondAddr);
    }

    function run() external {
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("ADDING ERC721 ENUMERABLE FUNCTIONS");
        console.log("=========================================");

        // Deploy new facet instance
        console.log("1. Deploying updated RugNFTFacet...");
        nftFacet = new RugNFTFacet();
        console.log("   RugNFTFacet deployed at:", address(nftFacet));

        // Perform diamond cut - replace the facet
        console.log("2. Performing diamond cut...");

        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = RugNFTFacet.tokenOfOwnerByIndex.selector;
        selectors[1] = RugNFTFacet.tokenByIndex.selector;

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(nftFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        IDiamondCut(diamondAddr).diamondCut(cuts, address(0), "");
        console.log("   - Added ERC721 enumerable functions");

        console.log("=========================================");
        console.log("[SUCCESS] ERC721 ENUMERABLE FUNCTIONS ADDED!");
        console.log("=========================================");
        console.log("The contract now supports:");
        console.log("- tokenOfOwnerByIndex(address,uint256)");
        console.log("- tokenByIndex(uint256)");
        console.log("- Rug discovery API will now work!");
    }
}
