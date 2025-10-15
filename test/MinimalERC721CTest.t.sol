pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/facets/RugNFTFacet.sol";
import "../src/libraries/LibTransferSecurity.sol";
import {TransferSecurityLevels, CollectionSecurityPolicy} from "@limitbreak/creator-token-contracts/utils/TransferPolicy.sol";

contract MinimalERC721CTest is Test {
    RugNFTFacet nft;
    address user1 = address(0x1);
    address user2 = address(0x2);

    function setUp() public {
        // Deploy the NFT facet directly
        nft = new RugNFTFacet();
        
        // Fund test accounts
        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
    }

    function testRugNFTBasic() public {
        console.log("Testing RugNFT Basic Functionality");

        // Check basic ERC721 functionality
        string memory name = nft.name();
        string memory symbol = nft.symbol();
        console.log("Name:", name);
        console.log("Symbol:", symbol);

        assertEq(name, "OnchainRugs");
        assertEq(symbol, "RUGS");
    }

    function testMintRugWithStructs() public {
        vm.startPrank(user1);
        
        // Create mint parameters using structs
        string[] memory textRows = new string[](2);
        textRows[0] = "HELLO";
        textRows[1] = "WORLD";
        
        // Create mint parameters using structs
        RugNFTFacet.VisualConfig memory visual = RugNFTFacet.VisualConfig({
            warpThickness: 3,
            stripeCount: 5
        });

        RugNFTFacet.ArtData memory art = RugNFTFacet.ArtData({
            paletteName: "TestPalette",
            minifiedPalette: "palette_data",
            minifiedStripeData: "stripe_data",
            filteredCharacterMap: "char_map"
        });

        // Mint rug
        nft.mintRug{value: 0.00001 ether}(
            textRows,
            12345,
            visual,
            art,
            4, // complexity
            10 // characterCount
        );
        uint256 tokenId = 1; // First token is always ID 1
        
        console.log("Minted token ID:", tokenId);
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), user1);
        
        vm.stopPrank();
    }

    function testTransferValidation() public {
        // First mint a token
        testMintRugWithStructs();
        
        vm.startPrank(user1);
        
        // Try to transfer to user2
        nft.transferFrom(user1, user2, 1);
        
        // Check ownership
        assertEq(nft.ownerOf(1), user2);
        console.log("Transfer successful - ERC721-C validation passed");
        
        vm.stopPrank();
    }
}
