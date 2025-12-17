// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

contract SimpleCut {
    address constant DIAMOND = 0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff;
    address constant NEW_FACET = 0xeBfD53cD9781E1F2D0cB7EFd7cBE6Dc7878836C8;

    function cut() external {
        // Diamond cut data for adding agent functions
        bytes memory data = hex"1f931c1c" // diamondCut selector
            hex"0000000000000000000000000000000000000000000000000000000000000020" // offset to cuts
            hex"0000000000000000000000000000000000000000000000000000000000000080" // offset to init
            hex"0000000000000000000000000000000000000000000000000000000000000000" // init data length
            hex"0000000000000000000000000000000000000000000000000000000000000001" // cuts length
            hex"000000000000000000000000ebfD53cD9781E1F2D0cB7EFd7cBE6Dc7878836C8" // facet address
            hex"0000000000000000000000000000000000000000000000000000000000000001" // action (Add)
            hex"0000000000000000000000000000000000000000000000000000000000000060" // offset to selectors
            hex"0000000000000000000000000000000000000000000000000000000000000003" // selectors length
            hex"4e9f1c5e" // cleanRugAgent
            hex"4e9f1c5d" // restoreRugAgent
            hex"4e9f1c5c" // masterRestoreRugAgent
            hex"00000000000000000000000000000000000000000000000000000000"; // init address (0x0)

        (bool success,) = DIAMOND.call(data);
        require(success, "Diamond cut failed");
    }
}
