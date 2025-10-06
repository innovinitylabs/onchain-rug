// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

/**
 * @title Update RugNFTFacet
 * @dev Upgrade the RugNFTFacet to fix time calculation bugs in tokenURI
 * @notice Fixes the * 1 days multipliers that were causing incorrect timing in metadata
 */
contract UpdateRugNFTFacet is Script {
    // Shape Sepolia deployed addresses
    address constant DIAMOND_ADDR = 0xd750d12040E536E230aE989247Df7d89453e94d9;

    // Deployment addresses
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
        console.log("Upgrading RugNFTFacet on Shape Sepolia");
        console.log("=========================================");
        console.log("Diamond address:", DIAMOND_ADDR);

        // Deploy new RugNFTFacet
        console.log("1. Deploying new RugNFTFacet...");
        RugNFTFacet newRugNFTFacet = new RugNFTFacet();
        address newFacetAddr = address(newRugNFTFacet);
        console.log("   New RugNFTFacet deployed at:", newFacetAddr);

        // Prepare facet cut for replacement
        console.log("2. Preparing facet cut for replacement...");
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: newFacetAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });

        // Execute upgrade
        console.log("3. Executing facet upgrade...");
        IDiamondCut(DIAMOND_ADDR).diamondCut(cuts, address(0), "");

        console.log("=========================================");
        console.log("RugNFTFacet Upgrade Complete!");
        console.log("=========================================");
        console.log("Fixed: Removed incorrect * 1 days multipliers in _getDirtLevel");
        console.log("Fixed: Removed incorrect * 1 days multipliers in _getAgingLevel");
        console.log("Fixed: Added frame immunity to _getAgingLevel calculations");
        console.log("Fixed: tokenURI now correctly shows dirt level 2 and aging level 10");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](25);
        // ERC721 Standard Functions (hardcoded selectors)
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
        selectors[14] = RugNFTFacet.burn.selector;
        selectors[15] = RugNFTFacet.getRugData.selector;
        selectors[16] = RugNFTFacet.getAgingData.selector;
        selectors[17] = RugNFTFacet.getMintPrice.selector;
        selectors[18] = RugNFTFacet.canMint.selector;
        selectors[19] = RugNFTFacet.isTextAvailable.selector;
        selectors[20] = RugNFTFacet.maxSupply.selector;
        selectors[21] = RugNFTFacet.walletMints.selector;
        selectors[22] = RugNFTFacet.isWalletException.selector;
        selectors[23] = RugNFTFacet.getFrameStatus.selector;
        selectors[24] = RugNFTFacet.getMaintenanceHistory.selector;
        return selectors;
    }
}