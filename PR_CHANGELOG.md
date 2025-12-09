# Marketplace Security Fixes & Make Offer Feature

## 🎯 Overview
This PR adds comprehensive security improvements to the marketplace and introduces a new "Make Offer" feature, allowing users to make offers on NFTs instead of only buying listed items.

## 🔒 Security Fixes

### Prevent Self-Purchases
- **Smart Contract**: Added `CannotBuyOwnListing` error check in `buyListing` function
- **Frontend**: Hide "Buy Now" button and display warning message when user tries to buy their own listing
- **Gas Optimization**: Check fails early, saving gas for users

### Stale Listing Protection
- **Smart Contract**: Added ownership verification before processing purchase (`SellerNoLongerOwner` error)
- **Auto-Cancellation**: Listings are automatically cancelled when NFT ownership changes
- **Implementation**: 
  - Added `cancelListingOnTransfer` function in `LibRugStorage`
  - Integrated with `_beforeTokenTransfer` hook in `RugNFTFacet`
  - Emits `ListingCancelled` event when auto-cancelled

### Gas Efficiency
- Ownership checks happen **before** any state changes
- Buyers save gas when attempting to purchase stale listings
- Early failure prevents unnecessary contract operations

## ✨ New Features

### Make Offer Functionality
- **Smart Contract Functions**:
  - `makeOffer(uint256 tokenId, uint256 price, uint256 duration)` - Create an offer
  - `acceptOffer(uint256 offerId)` - Accept an offer (auto-cancels listing)
  - `cancelOffer(uint256 offerId)` - Cancel an offer
  - `getOffer(uint256 offerId)` - Get offer details
  - `getActiveTokenOffers(uint256 tokenId)` - Get all active offers for a token

- **Frontend Hooks**:
  - `useMakeOffer()` - Create offers
  - `useAcceptOffer()` - Accept offers
  - `useCancelOffer()` - Cancel offers
  - `useOfferData()` - Fetch offer details
  - `useTokenOffers()` - Fetch active offers for a token

### UI/UX Improvements

#### Grid Card Enhancements
- **Ownership-Based Actions**:
  - Owned + Not Listed + Has Offers → Shows "Accept Offer" and "List for Sale" buttons
  - Owned + Listed → Shows "Cancel Listing" button (opens modal)
  - Not Owned + Not Listed + Has User's Offer → Shows "Cancel Offer" button
  - Not Owned + Not Listed + No User's Offer → Shows "Make Offer" button

- **Hover Overlay**:
  - Shows highest offer price for unlisted NFTs with offers
  - Displays offer count when multiple offers exist
  - Blue badge similar to green "LISTED" badge

#### Modal Enhancements
- **Make Offer Section**:
  - Shows user's active offer with price and expiration
  - "Cancel Offer" button when user has active offer
  - "Make Offer" form when no active offer

- **Listing Breakdown**:
  - Shows fee breakdown when creating listing
  - Displays: Listing Price, Creator Royalty, Diamond Frame Pool, Marketplace Fee
  - Shows net proceeds: "You Will Receive"
  - Real-time calculation as user enters price

- **Offer Management**:
  - Display all active offers for NFT owners
  - Accept/Cancel buttons for appropriate users
  - Handshake icon for Accept Offer buttons

#### Button Improvements
- "Cancel Listing" button opens modal instead of direct transaction
- "Cancel Offer" button opens modal to show offer details
- "Accept Offer" button uses handshake icon (🤝) instead of coins
- All action buttons properly stop event propagation

## 🛠️ Technical Changes

### Smart Contracts
- **RugMarketplaceFacet.sol**:
  - Added offer struct and storage mappings
  - Implemented offer creation, acceptance, and cancellation
  - Added events: `OfferCreated`, `OfferAccepted`, `OfferCancelled`
  - Fixed `OfferAccepted` event (removed 4th indexed parameter)

- **RugNFTFacet.sol**:
  - Integrated auto-cancellation on transfer
  - Calls `LibRugStorage.cancelListingOnTransfer` in `_beforeTokenTransfer`

- **LibRugStorage.sol**:
  - Added `cancelListingOnTransfer` utility function
  - Handles listing deactivation on ownership change

### Frontend Components
- **RugMarketGrid.tsx**:
  - Added offer checking logic with `UserOfferButton` component
  - Implemented `OfferIdChecker` and `OfferPriceChecker` components
  - Added `HighestOfferDisplay` for overlay price display
  - Improved card click handling

- **RugDetailModal.tsx**:
  - Added `UserOfferDisplay` component for offer management
  - Implemented `ListingBreakdown` component
  - Integrated offer acceptance/cancellation UI
  - Added offer expiration display

### Deployment
- Created `upgrade-manual.js` script for manual diamond upgrade
- Bypassed Foundry compilation issues with library test files
- Successfully upgraded diamond contracts with new offer functionality

## 🧪 Testing
- Added tests for security fixes:
  - `testCannotBuyListingWhenSellerTransferredNFT()`
  - `testAutoCancelListingOnTransfer()`
- Added tests for offer functionality:
  - `testMakeOffer()`
  - `testAcceptOffer()`
  - `testCancelOffer()`

## 📝 Files Changed
- `src/facets/RugMarketplaceFacet.sol` - Offer functionality
- `src/facets/RugNFTFacet.sol` - Auto-cancellation on transfer
- `src/libraries/LibRugStorage.sol` - Listing cancellation utility
- `components/RugMarketGrid.tsx` - Grid card improvements
- `components/rug-market/RugDetailModal.tsx` - Modal enhancements
- `hooks/use-marketplace-contract.ts` - Offer hooks
- `app/rug-market/page.tsx` - Page-level offer handling
- `test/RugMarketplace.t.sol` - Security and offer tests

## 🎨 UI/UX Highlights
- ✅ Clear visual feedback for user's active offers
- ✅ Transparent fee breakdown when listing
- ✅ Intuitive button placement based on ownership
- ✅ Offer price visibility in card overlays
- ✅ Handshake icon for accepting offers
- ✅ Modal-based actions for better user control

## 🔄 Migration Notes
- Existing listings continue to work normally
- New offer functionality is backward compatible
- Auto-cancellation only affects new transfers after upgrade
- No breaking changes to existing marketplace functions
