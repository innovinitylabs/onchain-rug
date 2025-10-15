// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/diamond/interfaces/IDiamondCut.sol";
import "../src/facets/RugNFTFacet.sol";

contract TestMint is Script {
    address constant DIAMOND = 0x0627da3FF590E92Ca249cE600548c25cf6eFEb1f;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        RugNFTFacet nft = RugNFTFacet(DIAMOND);

        string[] memory textRows = new string[](2);
        textRows[0] = "TEST";
        textRows[1] = "RUG";

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

        console.log("Attempting to mint...");

        try nft.mintRug{value: 0.00003 ether}(
            textRows,
            12345,
            visual,
            art,
            4, // complexity
            10 // characterCount
        ) {
            console.log("Mint successful!");
        } catch Error(string memory reason) {
            console.log("Mint failed with reason:", reason);
        } catch {
            console.log("Mint failed with unknown error");
        }

        vm.stopBroadcast();
    }
}
