// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/facets/RugMaintenanceFacet.sol";
import "../src/facets/RugAdminFacet.sol";
import "../src/libraries/LibRugStorage.sol";
import "../src/diamond/libraries/LibDiamond.sol";

contract AIMaintenanceAdminAuthTest is Test {
    RugMaintenanceFacet public maintenanceFacet;
    RugAdminFacet public adminFacet;

    address public owner = address(0xABCD);
    address public agent = address(0xA1A1);
    address public feeRecipient = address(0xFEE1);

    function setUp() public {
        vm.deal(owner, 100 ether);
        maintenanceFacet = new RugMaintenanceFacet();
        adminFacet = new RugAdminFacet();
    }
    
    function _setOwner() internal {
        // Set up diamond storage with proper owner for testing
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.contractOwner = owner;
        
        // Also set up rug storage for testing
        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        rs.serviceFee = 0;
        rs.feeRecipient = feeRecipient;
    }

    function testSetServiceFeeAndRecipient() public {
        _setOwner();
        vm.startPrank(owner);

        uint256 serviceFee = uint256(0.00042 ether);
        adminFacet.setServiceFee(serviceFee);
        adminFacet.setFeeRecipient(feeRecipient);

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        assertEq(rs.serviceFee, 0.00042 ether);
        assertEq(rs.feeRecipient, feeRecipient);

        vm.stopPrank();
    }

    function testAuthorizeAndRevokeAgent() public {
        _setOwner();
        vm.startPrank(owner);
        maintenanceFacet.authorizeMaintenanceAgent(agent);

        LibRugStorage.RugConfig storage rs = LibRugStorage.rugStorage();
        // Check that msg.sender (owner) authorized the agent
        assertTrue(rs.isOwnerAgentAllowed[owner][agent], "Agent should be authorized");

        maintenanceFacet.revokeMaintenanceAgent(agent);
        assertFalse(rs.isOwnerAgentAllowed[owner][agent], "Agent should be revoked");

        vm.stopPrank();
    }
}


