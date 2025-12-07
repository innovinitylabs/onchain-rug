pragma solidity 0.8.9;

struct AddressSet {
    address[] addrs;
    mapping(address => bool) saved;
    mapping(address => uint256) indexes;
}