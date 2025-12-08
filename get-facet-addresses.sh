#!/bin/bash

# Script to get all facet addresses from the Diamond contract
# Usage: ./get-facet-addresses.sh

DIAMOND="0x3d6670aC0A881Dcc742c17D687F5dfE05Af81cff"
RPC_URL="https://sepolia.base.org"

echo "Getting facet addresses from Diamond contract..."
echo "Diamond: $DIAMOND"
echo ""

# Get all facets
echo "All facets:"
cast call "$DIAMOND" "facets()" --rpc-url "$RPC_URL" | jq -r '.[] | "\(.facetAddress) - \(.functionSelectors | length) selectors"'

echo ""
echo "Getting specific facet addresses by selector:"
echo ""

# Common selectors
declare -A SELECTORS=(
    ["DiamondCutFacet"]="0x1f931c1c"  # diamondCut
    ["DiamondLoupeFacet"]="0x7a0ed627"  # facets
    ["RugNFTFacet"]="0x6352211e"  # ownerOf
    ["RugAdminFacet"]="0x8da5cb5b"  # updateCollectionCap (example)
    ["RugAgingFacet"]="0x8b5a2c0e"  # getDirtLevel
    ["RugMaintenanceFacet"]="0x4e69d60a"  # cleanRug
    ["RugCommerceFacet"]="0x2a55205a"  # royaltyInfo
    ["RugLaunderingFacet"]="0x8b5a2c0e"  # recordSale
    ["RugTransferSecurityFacet"]="0x01ffc9a7"  # supportsInterface
    ["RugMarketplaceFacet"]="0x4e69d60a"  # createListing
)

for facet in "${!SELECTORS[@]}"; do
    selector="${SELECTORS[$facet]}"
    address=$(cast call "$DIAMOND" "facetAddress(bytes4)" "$selector" --rpc-url "$RPC_URL" 2>/dev/null)
    if [ -n "$address" ] && [ "$address" != "0x0000000000000000000000000000000000000000" ]; then
        echo "$facet: $address"
    fi
done

echo ""
echo "To get all facets with their selectors, run:"
echo "cast call $DIAMOND 'facets()' --rpc-url $RPC_URL | jq"

