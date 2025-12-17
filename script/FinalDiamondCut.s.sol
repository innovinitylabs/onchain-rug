// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";

contract FinalDiamondCut is Script {
    address constant DIAMOND = 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff;
    address constant NEW_MAINTENANCE_FACET = 0xeBfD53cD9781E1F2D0cB7EFd7cBE6Dc7878836C8;

    function run() external {
        uint256 ownerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(ownerPrivateKey);

        // Replace the maintenance facet with direct payment version
        bytes4[] memory selectors = new bytes4[](11);
        selectors[0] = bytes4(0x4f44b188); // cleanRug(uint256)
        selectors[1] = bytes4(0x9282303d); // restoreRug(uint256)
        selectors[2] = bytes4(0x0c19faf9); // masterRestoreRug(uint256)
        selectors[3] = bytes4(0x6c174ed8); // getCleaningCost(uint256)
        selectors[4] = bytes4(0x40a9c122); // getRestorationCost(uint256)
        selectors[5] = bytes4(0x234e4777); // getMasterRestorationCost(uint256)
        selectors[6] = bytes4(0x89d929be); // canCleanRug(uint256)
        selectors[7] = bytes4(0xf4fbfba0); // canRestoreRug(uint256)
        selectors[8] = bytes4(0x6c3075f2); // needsMasterRestoration(uint256)
        selectors[9] = bytes4(0x7eeafdbc); // getMaintenanceOptions(uint256)
        selectors[10] = bytes4(0x87d9e54c); // getMaintenanceHistory(uint256,uint256,uint256,uint256,uint256,uint256)

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: NEW_MAINTENANCE_FACET,
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: selectors
        });

        IDiamondCut(DIAMOND).diamondCut(cuts, address(0), "");

        console.log("Diamond cut completed!");
        console.log("New maintenance facet:", NEW_MAINTENANCE_FACET);
        console.log("Replaced 11 maintenance functions with direct payment versions");

        vm.stopBroadcast();
    }
}

interface IDiamondCut {
    enum FacetCutAction { Add, Replace, Remove }
    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }
    function diamondCut(FacetCut[] calldata _diamondCut, address _init, bytes calldata _calldata) external;
}


