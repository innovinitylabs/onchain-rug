// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/diamond/libraries/LibDiamond.sol";

/**
 * @title Ethereum Sepolia Bridge Minting Upgrade
 * @dev Upgrades Ethereum Sepolia with cross-chain bridge minting capabilities
 * @notice Adds mintRugFor function for cross-chain NFT bridging
 */
contract UpgradeEthereumSepoliaBridgeMint is Script {
    address public diamondAddr;

    // New facet instance
    RugNFTFacet public rugNFTFacet;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get existing diamond address
        diamondAddr = vm.envAddress("NEXT_PUBLIC_ETHEREUM_SEPOLIA_CONTRACT");
        console.log("Upgrading Ethereum Sepolia with bridge minting at:", diamondAddr);

        console.log("1. Deploying updated NFT facet with bridge minting...");

        // Deploy updated NFT facet with bridge minting capabilities
        rugNFTFacet = new RugNFTFacet();
        console.log("   RugNFTFacet deployed at:", address(rugNFTFacet));

        console.log("2. Adding bridge minting capabilities...");

        // Add bridge minting function
        IDiamondCut.FacetCut[] memory bridgeMintCut = new IDiamondCut.FacetCut[](1);
        bridgeMintCut[0] = IDiamondCut.FacetCut({
            facetAddress: address(rugNFTFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: _getBridgeMintSelectors()
        });
        IDiamondCut(diamondAddr).diamondCut(bridgeMintCut, address(0), "");
        console.log("   ✅ Added bridge minting capabilities");

        console.log("3. Bridge minting upgrade complete!");
        console.log("   ✅ Cross-chain Support: mintRugFor function");
        console.log("   ✅ Relay Integration: Compatible with cross-chain bridges");
        console.log("   ✅ Enhanced Minting: Support for relayed minting operations");

        vm.stopBroadcast();
    }

    // Bridge minting function selectors
    function _getBridgeMintSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = RugNFTFacet.mintRugFor.selector; // Cross-chain mint for Relay
        return selectors;
    }
}