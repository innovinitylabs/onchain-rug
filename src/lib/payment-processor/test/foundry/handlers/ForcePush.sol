pragma solidity 0.8.9;

contract ForcePush {
    constructor(address dst) payable {
        selfdestruct(payable(dst));
    }
}