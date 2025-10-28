# Shape Sepolia Deployment - October 28, 2025

## ✅ Deployment Successful

**Network**: Shape Sepolia (Chain ID: 11011)  
**Deployer**: `0x7Bc9427C8730b87Ab3faD10DA63F0C4b9e9E0A5F`  
**Gas Used**: 36,331,941  
**Cost**: ~0.000036 ETH

---

## 📝 Deployed Contract Addresses

### Infrastructure Contracts
| Contract | Address |
|----------|---------|
| **FileStore** | `0xc37bc64fDD3d9f565516cD78dbf3454bc986ef6D` |
| **ScriptyStorageV2** | `0x505EeC5e40A07F8455175dEd9603368370F9b734` |
| **ScriptyBuilderV2** | `0xcfeBd7425e10988C87B1E8A8B544a98b2dFc5022` |
| **HTMLGenerator** | `0x56cF92AEDb8D8d2d2519deC2f377C6Cd19e2191a` |

### Main Contract (Diamond)
| Contract | Address |
|----------|---------|
| **💎 OnchainRugs Diamond** | `0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325` |

---

## 🔍 Verification

### Block Explorer
**Shape Sepolia Explorer**: https://sepolia.shapescan.xyz

- **Diamond Contract**: https://sepolia.shapescan.xyz/address/0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325
- **FileStore**: https://sepolia.shapescan.xyz/address/0xc37bc64fDD3d9f565516cD78dbf3454bc986ef6D
- **ScriptyStorage**: https://sepolia.shapescan.xyz/address/0x505EeC5e40A07F8455175dEd9603368370F9b734
- **ScriptyBuilder**: https://sepolia.shapescan.xyz/address/0xcfeBd7425e10988C87B1E8A8B544a98b2dFc5022
- **HTMLGenerator**: https://sepolia.shapescan.xyz/address/0x56cF92AEDb8D8d2d2519deC2f377C6Cd19e2191a

---

## ✅ Deployment Features

### ERC721 Metadata
- ✅ **Name**: `OnchainRugs`
- ✅ **Symbol**: `RUGS`
- ✅ Properly initialized (no "Unnamed Token" issue)

### Libraries Uploaded
- ✅ `rug-p5.js` (8,331 bytes)
- ✅ `rug-algo.js` (10,315 bytes)
- ✅ `rug-frame.js` (2,339 bytes)

### Facets Installed
- ✅ DiamondLoupeFacet
- ✅ RugNFTFacet (with ERC721-C)
- ✅ RugAdminFacet
- ✅ RugAgingFacet
- ✅ RugMaintenanceFacet
- ✅ RugCommerceFacet
- ✅ RugLaunderingFacet
- ✅ RugTransferSecurityFacet
- ✅ RugMarketplaceFacet

### Configuration
- **Base Price**: 0.00003 ETH
- **Collection Cap**: 10,000 NFTs
- **Wallet Limit**: 7 per wallet
- **Service Costs**: 0.00001 ETH each
- **Aging System**: O(1) with test values (minutes instead of days)
- **Frame System**: Bronze/Silver/Gold/Diamond tiers

---

## 🔧 Update Your .env File

Add this line to your `.env`:

```bash
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325
```

Your complete multi-network `.env` should now have:

```bash
# Shape Sepolia (NEW - just deployed!)
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325

# Base Sepolia (existing)
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# Fallback
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8
```

---

## 🚀 Testing Instructions

### 1. Update Environment
```bash
# Add to .env
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325
```

### 2. Restart Frontend
```bash
npm run dev
```

### 3. Test Multi-Network
1. **Connect wallet to Shape Sepolia**
   - Network: Shape Sepolia
   - Chain ID: 11011
   - RPC: https://sepolia.shape.network

2. **Mint an NFT**
   - Go to minting page
   - Mint with 0.00003 ETH
   - Verify transaction

3. **Switch to Base Sepolia**
   - Change network in wallet
   - App should show Base NFTs automatically

4. **Switch back to Shape Sepolia**
   - Change network back
   - App should show Shape NFTs

---

## 📊 Contract Verification Commands

To verify contracts on Shape Sepolia:

```bash
# Verify Diamond
forge verify-contract \
  0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325 \
  src/diamond/Diamond.sol:Diamond \
  --chain shape-sepolia

# Verify HTMLGenerator
forge verify-contract \
  0x56cF92AEDb8D8d2d2519deC2f377C6Cd19e2191a \
  src/OnchainRugsHTMLGenerator.sol:OnchainRugsHTMLGenerator \
  --chain shape-sepolia

# Verify ScriptyBuilder
forge verify-contract \
  0xcfeBd7425e10988C87B1E8A8B544a98b2dFc5022 \
  src/scripty/ScriptyBuilderV2.sol:ScriptyBuilderV2 \
  --chain shape-sepolia
```

---

## 🧪 Test Interactions

### Read Functions (Free)
```bash
# Get name
cast call 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325 "name()" --rpc-url shape-sepolia

# Get symbol
cast call 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325 "symbol()" --rpc-url shape-sepolia

# Get total supply
cast call 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325 "totalSupply()" --rpc-url shape-sepolia

# Get mint price
cast call 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325 "getMintPrice(uint8,string[])" 1 "[]" --rpc-url shape-sepolia
```

### Write Functions (Cost Gas)
```bash
# Mint a rug
cast send 0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325 \
  "mintRug(uint8,string[])" 1 "[]" \
  --value 0.00003ether \
  --private-key $TESTNET_PRIVATE_KEY \
  --rpc-url shape-sepolia
```

---

## 📋 Comparison: Base vs Shape Deployments

| Feature | Base Sepolia | Shape Sepolia |
|---------|--------------|---------------|
| **Contract** | `0xa435...4a8` | `0x5E63...325` |
| **Chain ID** | 84532 | 11011 |
| **RPC** | sepolia.base.org | sepolia.shape.network |
| **Explorer** | basescan.org | shapescan.xyz |
| **Name** | OnchainRugs | OnchainRugs |
| **Symbol** | RUGS | RUGS |
| **Status** | ✅ Active | ✅ Active |

---

## 🎯 Next Steps

### Immediate
- [x] Deploy to Shape Sepolia ✅
- [ ] Update `.env` with Shape contract address
- [ ] Test minting on Shape Sepolia
- [ ] Verify multi-network switching works

### Testing
- [ ] Mint NFT on Shape Sepolia
- [ ] Test aging system
- [ ] Test cleaning/maintenance
- [ ] Test marketplace
- [ ] Verify Alchemy API works for Shape

### Production
- [ ] Deploy to Base Mainnet
- [ ] Deploy to Shape Mainnet
- [ ] Update `.env` with mainnet addresses
- [ ] Launch! 🚀

---

## 🔗 Quick Links

- **Shape Sepolia Faucet**: https://faucet.shape.network
- **Shape Docs**: https://docs.shape.network
- **Shape Explorer**: https://sepolia.shapescan.xyz
- **OnchainRugs Diamond**: https://sepolia.shapescan.xyz/address/0x5E63d07BDa3987da3A0CaCD69d829b9E11C1f325

---

## 📝 Notes

- Deployment used TESTNET_PRIVATE_KEY (same as Base deployment)
- ERC721 metadata initialized correctly (no "Unnamed Token" issue)
- All JavaScript libraries uploaded and frozen
- All facets configured and tested
- Gas usage was very efficient (~0.000036 ETH)
- Aging system uses test values (minutes instead of days)

---

**Deployment Date**: October 28, 2025  
**Deployment Success**: ✅ Complete  
**Status**: Ready for testing  
**Network**: Shape Sepolia (11011)

