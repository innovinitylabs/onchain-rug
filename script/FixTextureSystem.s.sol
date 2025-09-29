// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugLaunderingFacet.sol";

/**
 * @title Fix Texture System - Persistent Wear Mechanics
 * @dev Updates RugNFTFacet, RugMaintenanceFacet, and RugLaunderingFacet
 * to implement persistent texture wear with proper cleaning/restoration mechanics
 */
contract FixTextureSystem is Script {
    address public constant DIAMOND_ADDR = 0x6F7D033F046eE9c41A73713Fe5620D8f64C3BbAd;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=========================================");
        console.log("Fixing Texture System - Persistent Wear Mechanics");
        console.log("=========================================");

        // Deploy updated facets with new texture system
        RugNFTFacet newRugNFTFacet = new RugNFTFacet();
        address newNFTAddr = address(newRugNFTFacet);
        console.log("New RugNFTFacet deployed at:", newNFTAddr);

        RugMaintenanceFacet newRugMaintenanceFacet = new RugMaintenanceFacet();
        address newMaintenanceAddr = address(newRugMaintenanceFacet);
        console.log("New RugMaintenanceFacet deployed at:", newMaintenanceAddr);

        RugLaunderingFacet newRugLaunderingFacet = new RugLaunderingFacet();
        address newLaunderingAddr = address(newRugLaunderingFacet);
        console.log("New RugLaunderingFacet deployed at:", newLaunderingAddr);

        // Get current facet addresses to know which selectors to replace
        bytes4 facetAddressSelector = bytes4(keccak256("facetAddress(bytes4)"));

        // Replace RugNFTFacet (includes updated texture calculation)
        (bool success1,) = DIAMOND_ADDR.call(abi.encodeWithSelector(facetAddressSelector, bytes4(keccak256("mintRug(string[],uint256,string,string,string,string,uint8,uint8,uint256,uint256)"))));
        require(success1, "Failed to get NFT facet");
        address oldNFTAddr = abi.decode(abi.encode(success1), (address));

        // Replace RugMaintenanceFacet (includes updated cleaning/restoration)
        (bool success2,) = DIAMOND_ADDR.call(abi.encodeWithSelector(facetAddressSelector, bytes4(keccak256("cleanRug(uint256)"))));
        require(success2, "Failed to get maintenance facet");
        address oldMaintenanceAddr = abi.decode(abi.encode(success2), (address));

        // Replace RugLaunderingFacet (includes updated laundering)
        (bool success3,) = DIAMOND_ADDR.call(abi.encodeWithSelector(facetAddressSelector, bytes4(keccak256("recordSale(uint256,address,address,uint256)"))));
        require(success3, "Failed to get laundering facet");
        address oldLaunderingAddr = abi.decode(abi.encode(success3), (address));

        // Update all three facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](3);

        // RugNFTFacet replacement (for updated texture calculation and minting)
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: newNFTAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugNFTSelectors()
        });

        // RugMaintenanceFacet replacement (for updated cleaning/restoration)
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: newMaintenanceAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugMaintenanceSelectors()
        });

        // RugLaunderingFacet replacement (for updated laundering)
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: newLaunderingAddr,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: _getRugLaunderingSelectors()
        });

        IDiamondCut(DIAMOND_ADDR).diamondCut(cuts, address(0), "");

        console.log("=========================================");
        console.log("Texture System Fixed!");
        console.log("Texture wear is now persistent once achieved");
        console.log("Cleaning delays further wear (resets progress timer)");
        console.log("Restoration reduces existing wear (lowers max level)");
        console.log("Master restoration fully rejuvenates (resets max level)");
        console.log("Laundering resets everything to pristine condition");
        console.log("=========================================");

        vm.stopBroadcast();
    }

    function _getRugNFTSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](26);
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
        selectors[12] = bytes4(0x01ffc9a7); // supportsInterface(bytes4)
        selectors[13] = bytes4(0xb88d4fde); // safeTransferFrom(address,address,uint256,bytes)

        // Rug-specific functions
        selectors[14] = RugNFTFacet.mintRug.selector;             // 0f495d0c
        selectors[15] = RugNFTFacet.burn.selector;                // 42966c68
        selectors[16] = RugNFTFacet.getRugData.selector;          // 2e99fe3f
        selectors[17] = RugNFTFacet.getAgingData.selector;        // a8accc46
        selectors[18] = RugNFTFacet.getMintPrice.selector;        // 559e775b
        selectors[19] = RugNFTFacet.canMint.selector;             // c2ba4744
        selectors[20] = RugNFTFacet.isTextAvailable.selector;     // fdd9d9e8
        selectors[21] = RugNFTFacet.maxSupply.selector;           // d5abeb01
        selectors[22] = RugNFTFacet.walletMints.selector;         // f0293fd3
        selectors[23] = RugNFTFacet.isWalletException.selector;   // 2d2bf633
        selectors[24] = RugNFTFacet.getFrameLevel.selector;       // ceffb063
        selectors[25] = RugNFTFacet.updateFrameLevel.selector;    // 650def5b

        return selectors;
    }

    function _getRugMaintenanceSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = RugMaintenanceFacet.cleanRug.selector;
        selectors[1] = RugMaintenanceFacet.restoreRug.selector;
        selectors[2] = RugMaintenanceFacet.masterRestoreRug.selector;
        selectors[3] = RugMaintenanceFacet.getCleaningCost.selector;
        selectors[4] = RugMaintenanceFacet.getRestorationCost.selector;
        selectors[5] = RugMaintenanceFacet.getMasterRestorationCost.selector;
        selectors[6] = RugMaintenanceFacet.getMaintenanceOptions.selector;
        return selectors;
    }

    function _getRugLaunderingSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = RugLaunderingFacet.recordSale.selector;
        selectors[1] = RugLaunderingFacet.triggerLaundering.selector;
        selectors[2] = RugLaunderingFacet.updateLaunderingThreshold.selector;
        selectors[3] = RugLaunderingFacet.wouldTriggerLaundering.selector;
        selectors[4] = RugLaunderingFacet.getSaleHistory.selector;
        selectors[5] = RugLaunderingFacet.getMaxRecentSalePrice.selector;
        selectors[6] = RugLaunderingFacet.getLaunderingConfig.selector;
        selectors[7] = RugLaunderingFacet.getLaunderingStats.selector;
        return selectors;
    }
}
