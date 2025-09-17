// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/OnchainRugs.sol";

contract TestMintTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("TESTNET_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Testing mint on Shape L2 Testnet...");
        console.log("Contract: 0x77c0F87621B7509eD76Bb78ce39eEaD9E98E6670");
        console.log("Minter:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        OnchainRugs rugs = OnchainRugs(0x77c0F87621B7509eD76Bb78ce39eEaD9E98E6670);
        
        // Prepare test data - Use a unique text that hasn't been minted yet
        string[] memory textRows = new string[](1);
        textRows[0] = "TESTNET";

        uint256 seed = 690915066;
        string memory paletteName = "Minimalist";
        string memory minifiedStripeData = '[{"y":0,"h":56.393899684771895,"pc":"#CCCCCC","sc":null,"wt":"textured","wv":0.22104325396940114},{"y":56.393899684771895,"h":51.67406065389514,"pc":"#F5F5F5","sc":null,"wt":"mixed","wv":0.3131245376542211},{"y":108.06796033866704,"h":51.546608144417405,"pc":"#CCCCCC","sc":null,"wt":"solid","wv":0.31221992345526817},{"y":159.61456848308444,"h":76.25165693461895,"pc":"#666666","sc":null,"wt":"solid","wv":0.2919234674423933},{"y":235.8662254177034,"h":80.40717388503253,"pc":"#333333","sc":null,"wt":"mixed","wv":0.32633773079141976},{"y":316.2733993027359,"h":60.57727770879865,"pc":"#333333","sc":null,"wt":"mixed","wv":0.12729814406484366},{"y":376.8506770115346,"h":63.76767230220139,"pc":"#FFFFFF","sc":null,"wt":"solid","wv":0.4518931821919978},{"y":440.61834931373596,"h":79.35153242200613,"pc":"#F5F5F5","sc":null,"wt":"solid","wv":0.44769024699926374},{"y":519.9698817357421,"h":50.28136386536062,"pc":"#666666","sc":null,"wt":"textured","wv":0.12275641439482571},{"y":570.2512456011027,"h":81.50977363809943,"pc":"#CCCCCC","sc":null,"wt":"textured","wv":0.41085940692573786},{"y":651.7610192392021,"h":64.87402529455721,"pc":"#000000","sc":null,"wt":"solid","wv":0.38940608846023683},{"y":716.6350445337594,"h":66.38214647769928,"pc":"#999999","sc":null,"wt":"solid","wv":0.19279082901775837},{"y":783.0171910114586,"h":84.90979733876884,"pc":"#000000","sc":null,"wt":"solid","wv":0.44515085583552716},{"y":867.9269883502275,"h":82.27368200197816,"pc":"#000000","sc":null,"wt":"textured","wv":0.30285413693636654},{"y":950.2006703522056,"h":77.67111946828663,"pc":"#000000","sc":null,"wt":"solid","wv":0.15621434981003404},{"y":1027.8717898204923,"h":78.50447360426188,"pc":"#CCCCCC","sc":null,"wt":"solid","wv":0.17077007815241813},{"y":1106.3762634247541,"h":75.87638429366052,"pc":"#CCCCCC","sc":null,"wt":"solid","wv":0.13245128048583865},{"y":1182.2526477184147,"h":17.747352281585336,"pc":"#666666","sc":null,"wt":"solid","wv":0.2247698562219739}]';
        string memory minifiedPalette = '{"name":"Minimalist","colors":["#FFFFFF","#F5F5F5","#E0E0E0","#CCCCCC","#999999","#666666","#333333","#000000"]}';
        string memory filteredCharacterMap = '{"F":["11111","10000","11110","10000","10000","10000","10000"],"I":["11111","00100","00100","00100","00100","00100","11111"],"X":["10001","01010","00100","01010","10001","10001","10001"],"E":["11111","10000","10000","11110","10000","10000","11111"],"D":["11110","10001","10001","10001","10001","10001","11110"]," ":["00000","00000","00000","00000","00000","00000","00000"]}';
        uint8 warpThickness = 3;
        uint8 complexity = 2;
        uint256 characterCount = 5;
        uint256 stripeCount = 19;

        // Calculate price
        uint256 price = rugs.getMintPrice(textRows.length);
        console.log("Mint price:", price / 1e18, "ETH");

        // Mint
        rugs.mintRug{value: price}(
            textRows,
            seed,
            paletteName,
            minifiedStripeData,
            minifiedPalette,
            filteredCharacterMap,
            warpThickness,
            complexity,
            characterCount,
            stripeCount
        );

        vm.stopBroadcast();

        console.log("SUCCESS: Mint successful!");
        console.log("Total supply:", rugs.totalSupply());
        console.log("Token URI:", rugs.tokenURI(1));
    }
}
