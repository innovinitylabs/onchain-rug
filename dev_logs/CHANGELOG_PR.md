# Changelog

## 🚀 Major Updates

### Next.js Security Update
- **Updated Next.js from 15.5.2 to 16.0.7** to fix security vulnerability (CVE-2025-66478)
- Updated `eslint-config-next` to match Next.js version
- Added `--webpack` flag to build script to ensure compatibility

## 🐛 Bug Fixes

### TypeScript & Build Errors
- Fixed `BigInt.prototype.toJSON` polyfill TypeScript error in collection route API
- Fixed missing `filteredCharacterMap` property in `RugPermanentData` interface
- Fixed Next.js 15 route parameter type errors (updated to Promise-based params)
- Fixed `config.defaultChainId` → `config.chainId` property name errors
- Removed non-existent `error` property references from `makeRPCCall` return type
- Fixed bigint sorting issue in rarity comparison (converted to number)

### Build Configuration
- Fixed missing `viem` imports (`AbiParameter`, `decodeAbiParameters`)
- Excluded murky library scripts from Next.js build (using webpack IgnorePlugin)
- Fixed import path in test-totalsupply route API
- Removed unused `testNFTs` placeholder data with incorrect types

## 🎨 UI/UX Improvements

### Component Refactoring
- **NFTDisplay Component**: Removed all overlays to make it a pure art display module
  - Removed condition badge overlay
  - Removed controls overlay
  - Removed price badge overlay
  - Removed favorite/copy/refresh handlers
  - Component now focuses solely on rendering NFT artwork

### Navigation Cleanup
- Removed "NFT Demo" page from navigation (desktop and mobile)
- Removed "Gallery" link from navigation (page still exists, just not linked)
- Cleaned up unused imports (`ImageIcon`)

## 🏗️ Architecture Improvements

### Modular Modal System
- Created new `RugDetailModal` component for marketplace-specific NFT details
- Created `rug-market-data-adapter.ts` utility for data consistency between formats
- Decoupled NFT detail modal from `NFTDisplay` component
- Updated `NFTDetailModal` to point to correct routes (`/rug-market/${tokenId}`)

### Code Quality
- Fixed type consistency across NFT data adapters
- Improved error handling in blockchain data fetching
- Enhanced logging for debugging RPC calls

## 📝 Files Changed

### Modified
- `app/api/rug-market/collection/route.ts` - BigInt serialization fix
- `app/api/rug-market/nft/[tokenId]/*/route.ts` - Next.js 15 params fix
- `app/rug-market/page.tsx` - Removed placeholder data, fixed sorting
- `app/rug-market/[tokenId]/page.tsx` - Fixed config property name
- `components/NFTDisplay.tsx` - Removed overlays, pure art display
- `components/Navigation.tsx` - Removed demo and gallery links
- `components/NFTDetailModal.tsx` - Updated route paths
- `lib/blockchain-fetcher.ts` - Added missing filteredCharacterMap
- `app/api/rug-market/collection/direct-contract-fetcher.ts` - Fixed imports, removed error property
- `next.config.ts` - Webpack config for murky scripts exclusion
- `tsconfig.json` - Excluded scripts directory
- `package.json` - Updated Next.js and dependencies

### Added
- `components/rug-market/RugDetailModal.tsx` - New modular modal component
- `utils/rug-market-data-adapter.ts` - Data adapter utilities

### Deleted
- `app/nft-display-demo/page.tsx` - Removed NFT demo page

## ✅ Testing

- All Vercel build errors resolved
- TypeScript compilation successful
- All type errors fixed
- Build completes successfully with Next.js 16.0.7

## 🔒 Security

- Fixed CVE-2025-66478 by updating Next.js to 16.0.7

---

**Note**: This PR focuses on fixing build errors, improving code quality, and updating dependencies for security. The NFTDisplay component is now a pure art rendering module, and marketplace-specific UI elements have been moved to dedicated components.

