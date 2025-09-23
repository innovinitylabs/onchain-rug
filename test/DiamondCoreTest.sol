// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {Diamond} from "../src/diamond/Diamond.sol";
import {DiamondCutFacet} from "../src/diamond/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../src/diamond/facets/DiamondLoupeFacet.sol";
import {IDiamondCut} from "../src/diamond/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../src/diamond/interfaces/IDiamondLoupe.sol";
import {LibDiamond} from "../src/diamond/libraries/LibDiamond.sol";

contract DiamondCoreTest is Test {
    Diamond diamond;
    DiamondCutFacet diamondCutFacet;
    DiamondLoupeFacet diamondLoupeFacet;

    address owner = address(1);
    address user = address(2);

    function setUp() public {
        // Deploy facets
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();

        // Deploy diamond with owner and diamondCutFacet
        diamond = new Diamond(owner, address(diamondCutFacet));
    }

    function test_DiamondDeployment() public {
        // Test that diamond deployed successfully
        assertTrue(address(diamond) != address(0), "Diamond should deploy");

        // Note: Owner testing requires adding ownership facet first
        // This will be tested after adding ownership facet
    }

    function test_DiamondCutFacetAdded() public {
        // Test that diamondCut function exists on diamond
        vm.prank(owner);
        (bool success,) = address(diamond).call(abi.encodeWithSelector(IDiamondCut.diamondCut.selector, new IDiamondCut.FacetCut[](0), address(0), ""));
        assertTrue(success, "diamondCut should exist on diamond");
    }

    function test_AddLoupeFacet() public {
        // Prepare facet cut to add loupe functions
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddresses.selector;
        selectors[3] = IDiamondLoupe.facetAddress.selector;

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        // Add loupe facet
        vm.prank(owner);
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");

        // Test loupe functions work
        IDiamondLoupe.Facet[] memory facets = IDiamondLoupe(address(diamond)).facets();
        assertTrue(facets.length > 0, "Should have facets after adding loupe");

        // Test facetAddress function
        address cutFacet = IDiamondLoupe(address(diamond)).facetAddress(IDiamondCut.diamondCut.selector);
        assertEq(cutFacet, address(diamondCutFacet), "Should find diamondCut facet");

        address loupeFacet = IDiamondLoupe(address(diamond)).facetAddress(IDiamondLoupe.facets.selector);
        assertEq(loupeFacet, address(diamondLoupeFacet), "Should find loupe facet");
    }

    function test_OnlyOwnerCanCut() public {
        // Try to call diamondCut from non-owner
        vm.prank(user);
        vm.expectRevert("LibDiamond: Must be contract owner");
        IDiamondCut(address(diamond)).diamondCut(new IDiamondCut.FacetCut[](0), address(0), "");
    }

    function test_FallbackWorks() public {
        // Add loupe facet first
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = IDiamondLoupe.facets.selector;

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        vm.prank(owner);
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");

        // Test that calling facets() on diamond works (fallback routing)
        IDiamondLoupe.Facet[] memory facets = IDiamondLoupe(address(diamond)).facets();
        assertEq(facets.length, 2, "Should have 2 facets (cut + loupe)");
    }

    function test_ReceiveEther() public {
        // Test that diamond can receive ether
        vm.deal(user, 1 ether);
        vm.prank(user);
        (bool success,) = address(diamond).call{value: 0.1 ether}("");
        assertTrue(success, "Diamond should accept ether");

        assertEq(address(diamond).balance, 0.1 ether, "Diamond should have received ether");
    }
}
