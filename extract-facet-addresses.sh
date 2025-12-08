#!/bin/bash

# Script to extract and display facet addresses from Diamond contract
# Usage: ./extract-facet-addresses.sh

DIAMOND="0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
RPC_URL="https://sepolia.base.org"

echo "Extracting facet addresses from Diamond contract..."
echo "Diamond: $DIAMOND"
echo ""

# Get facets and parse with cast
echo "Facet Addresses:"
echo "=================="

# Use cast to decode the facets() return value
cast call "$DIAMOND" "facets()" --rpc-url "$RPC_URL" | \
  cast --abi-decode "facets()((address,bytes4[])[])" | \
  jq -r '.[] | "\(.facetAddress) - \(.functionSelectors | length) selectors"'

echo ""
echo "To get a specific facet by selector:"
echo "cast call $DIAMOND 'facetAddress(bytes4)' SELECTOR --rpc-url $RPC_URL"
echo ""
echo "Common selectors:"
echo "  DiamondCutFacet (diamondCut): 0x1f931c1c"
echo "  DiamondLoupeFacet (facets): 0x7a0ed627"
echo "  RugNFTFacet (ownerOf): 0x6352211e"
echo "  RugAgingFacet (getDirtLevel): 0x8b5a2c0e"
echo "  RugMaintenanceFacet (cleanRug): 0x4e69d60a"
echo "  RugCommerceFacet (royaltyInfo): 0x2a55205a"
echo "  RugMarketplaceFacet (createListing): 0x4e69d60a"

