pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";

contract ReplaceRugNFTFacet is Script {
    address constant DIAMOND = 0x8B68C94c4DDFa604FFCD7e32Aa70987586DAB222;
    address constant NEW_RUG_NFT_FACET = 0x0353e6665eDE612CB59BEF5EfdCd8F4A76b20e99;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Replace RugNFTFacet with updated version (Replace action)
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
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
        selectors[13] = 0x91af3155; // mintRug
        selectors[14] = 0x42966c68; // burn
        selectors[15] = 0x2e99fe3f; // getRugData
        selectors[16] = 0xa8accc46; // getAgingData
        selectors[17] = 0x559e775b; // getMintPrice
        selectors[18] = 0xc2ba4744; // canMint
        selectors[19] = 0xfdd9d9e8; // isTextAvailable
        selectors[20] = 0xd5abeb01; // maxSupply
        selectors[21] = 0xf0293fd3; // walletMints
        selectors[22] = 0x2d2bf633; // isWalletException
        
        // ERC721-C functions
        selectors[23] = 0x098144d4; // getTransferValidator
        selectors[24] = 0xbe537f43; // getSecurityPolicy
        selectors[25] = 0x495c8bf9; // getWhitelistedOperators
        selectors[26] = 0xd007af5c; // getPermittedContractReceivers
        selectors[27] = 0x1b25b077; // isTransferAllowed
        
        // Interface support
        selectors[28] = 0x01ffc9a7; // supportsInterface
        
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: NEW_RUG_NFT_FACET,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });
        
        IDiamondCut(DIAMOND).diamondCut(cut, address(0), "");
        
        console.log("RugNFTFacet replaced successfully!");
        console.log("New facet address:", NEW_RUG_NFT_FACET);
        
        vm.stopBroadcast();
    }
}
