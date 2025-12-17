# Multi-Network Guide: Shape & Base Support

## Overview

OnchainRugs now supports **automatic multi-network operation** across both Shape and Base networks. Users can seamlessly switch between networks, and the app automatically uses the correct contract address and API endpoints.

---

## 🌐 Supported Networks

| Network | Chain ID | Status | Purpose |
|---------|----------|--------|---------|
| **Shape Sepolia** | 11011 | ✅ Supported | Testing |
| **Shape Mainnet** | 360 | ✅ Supported | Production |
| **Base Sepolia** | 84532 | ✅ Deployed | Testing |
| **Base Mainnet** | 8453 | ✅ Supported | Production |

---

## 🚀 How It Works

### Automatic Network Detection

The app automatically detects which network the user's wallet is connected to and:

1. **Routes to correct contract address**
2. **Uses appropriate Alchemy API endpoint**
3. **Displays network-specific information**
4. **Handles network switching seamlessly**

### Example User Flow

```
User connects wallet → MetaMask shows Base Sepolia (84532)
  ↓
App detects chainId: 84532
  ↓
App uses: NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT
  ↓
Alchemy API routes to: base-sepolia.g.alchemy.com
  ↓
User sees their Base Sepolia NFTs ✅
```

**User switches to Shape Sepolia in wallet**
```
MetaMask switches to Shape Sepolia (11011)
  ↓
App detects chainId change: 11011
  ↓
App switches to: NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT
  ↓
Alchemy API routes to: shape-sepolia.g.alchemy.com
  ↓
User sees their Shape Sepolia NFTs ✅
```

---

## ⚙️ Configuration

### Environment Variables

Set network-specific contract addresses and RPC URLs in your `.env`:

```bash
# ============================================
# CONTRACT ADDRESSES
# ============================================

# Base Sepolia (Current deployment)
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# Shape Sepolia (Deploy when ready)
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x...

# Base Mainnet (Future)
NEXT_PUBLIC_BASE_MAINNET_CONTRACT=0x...

# Shape Mainnet (Future)
NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT=0x...

# Fallback (if network-specific not set)
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# ============================================
# RPC ENDPOINTS
# ============================================

# Primary RPC (for default network)
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Network-specific RPCs (optional - overrides defaults)
NEXT_PUBLIC_SHAPE_SEPOLIA_RPC=https://sepolia.shape.network
NEXT_PUBLIC_SHAPE_MAINNET_RPC=https://mainnet.shape.network
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_BASE_MAINNET_RPC=https://mainnet.base.org

# Alternative RPC providers (if needed)
# NEXT_PUBLIC_SHAPE_SEPOLIA_RPC=https://shape-sepolia.g.alchemy.com/v2/YOUR_KEY
# NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

# ============================================
# API KEYS
# ============================================

# API Keys (work across all networks)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### How Fallback Works

**Contract Addresses:**
```typescript
// Priority order for Base Sepolia:
1. NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT (if set)
2. NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT (fallback)
3. Empty string (if neither set)
```

**RPC URLs:**
```typescript
// Priority order for Base Sepolia:
1. NEXT_PUBLIC_BASE_SEPOLIA_RPC (if set)
2. Default: 'https://sepolia.base.org' (hardcoded fallback)
```

**Supported RPC Providers:**
- **Shape Sepolia**: `https://sepolia.shape.network` (default)
- **Shape Mainnet**: `https://mainnet.shape.network` (default)
- **Base Sepolia**: `https://sepolia.base.org` (default)
- **Base Mainnet**: `https://mainnet.base.org` (default)
- **Alchemy**: `https://{network}.g.alchemy.com/v2/{key}` (optional)

---

## 🛠️ Deployment Workflow

### Deploy to Multiple Networks

You can deploy the same contracts to multiple networks:

#### 1. Deploy to Base Sepolia

```bash
forge script script/DeployBaseSepolia.s.sol \
  --rpc-url base-sepolia \
  --broadcast \
  --verify
```

**Result**: Get contract address like `0xa43532205Fc90b286Da98389a9883347Cc4064a8`

#### 2. Deploy to Shape Sepolia

```bash
forge script script/DeployShapeSepolia.s.sol \
  --rpc-url shape-sepolia \
  --broadcast \
  --verify
```

**Result**: Get different contract address like `0x...`

#### 3. Update Environment

```bash
# Add to .env
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x... # from step 2
```

#### 4. Deploy Frontend

```bash
# Frontend now supports both networks automatically
npm run build
npm run start
```

---

## 💻 Using in Code

### React Hook (Recommended)

```typescript
import { useNetworkContract } from '@/hooks/use-network-contract'

function MyComponent() {
  const { 
    contractAddress,  // Current network's contract
    chainId,          // User's current chain ID
    networkName,      // "Base Sepolia", "Shape Sepolia", etc.
    isSupported,      // Is this network supported?
    isBase,           // True if Base Sepolia or Base Mainnet
    isShape,          // True if Shape Sepolia or Shape Mainnet
    isTestnet,        // True if Sepolia network
    isMainnet         // True if mainnet network
  } = useNetworkContract()

  if (!isSupported) {
    return <div>Please connect to a supported network</div>
  }

  return (
    <div>
      <p>Network: {networkName}</p>
      <p>Contract: {contractAddress}</p>
      <button onClick={() => mintNFT(contractAddress)}>
        Mint on {networkName}
      </button>
    </div>
  )
}
```

### Direct Import

```typescript
import { getContractAddress, isSupportedChain } from '@/lib/web3'
import { useChainId } from 'wagmi'

function MyComponent() {
  const chainId = useChainId()
  const contractAddress = getContractAddress(chainId)
  
  if (!isSupportedChain(chainId)) {
    return <div>Unsupported network</div>
  }

  // Use contractAddress...
}
```

---

## 🎯 Example Scenarios

### Scenario 1: Single Network (Current)

**Setup**:
```bash
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8
```

**Behavior**:
- Users on Base Sepolia: ✅ Works perfectly
- Users on Shape Sepolia: ⚠️ No contract, shows message to switch
- Users on other networks: ⚠️ Not supported

### Scenario 2: Dual Testnet Support

**Setup**:
```bash
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0xShapeSepoliaAddress...
```

**Behavior**:
- Users on Base Sepolia: ✅ Uses Base contract
- Users on Shape Sepolia: ✅ Uses Shape contract
- Users can switch between both seamlessly
- Other networks: ⚠️ Not supported

### Scenario 3: Full Multi-Network (Production)

**Setup**:
```bash
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8
NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0xShapeSepoliaAddress...
NEXT_PUBLIC_BASE_MAINNET_CONTRACT=0xBaseMainnetAddress...
NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT=0xShapeMainnetAddress...
```

**Behavior**:
- All 4 networks fully supported
- Users can deploy and test on testnets
- Same users can use mainnet versions
- Seamless experience across all networks

---

## 🔍 Network Detection in Components

The app automatically provides network info in several ways:

### 1. Via Wagmi Hooks

```typescript
import { useChainId, useNetwork } from 'wagmi'

const chainId = useChainId() // 84532, 11011, etc.
const { chain } = useNetwork() // Full chain object
```

### 2. Via Custom Hook

```typescript
import { useNetworkContract } from '@/hooks/use-network-contract'

const { networkName, isBase, isTestnet } = useNetworkContract()
```

### 3. Via Utility Functions

```typescript
import { getChainName, isSupportedChain } from '@/lib/web3'

const name = getChainName(84532) // "Base Sepolia"
const supported = isSupportedChain(84532) // true
```

---

## 🎨 UI Best Practices

### Show Current Network

```typescript
function NetworkBadge() {
  const { networkName, isTestnet } = useNetworkContract()
  
  return (
    <div className={isTestnet ? 'bg-yellow-500' : 'bg-green-500'}>
      {networkName}
      {isTestnet && ' (Testnet)'}
    </div>
  )
}
```

### Prompt Network Switch

```typescript
function RequireNetwork({ children, requiredChainId }) {
  const chainId = useChainId()
  const { switchNetwork } = useSwitchNetwork()
  
  if (chainId !== requiredChainId) {
    return (
      <button onClick={() => switchNetwork?.(requiredChainId)}>
        Switch to required network
      </button>
    )
  }
  
  return children
}
```

### Multi-Network Stats

```typescript
function CollectionStats() {
  const { contractAddress, networkName } = useNetworkContract()
  const { data: supply } = useReadContract({
    address: contractAddress,
    abi: onchainRugsABI,
    functionName: 'totalSupply'
  })
  
  return (
    <div>
      <h3>{networkName} Collection</h3>
      <p>Total Supply: {supply?.toString()}</p>
    </div>
  )
}
```

---

## 📊 Monitoring Multiple Networks

### Track Deployments

Keep a record of all deployments:

```markdown
| Network | Contract | Deployed | NFTs Minted |
|---------|----------|----------|-------------|
| Base Sepolia | 0xa435...4a8 | Oct 28, 2025 | 0 |
| Shape Sepolia | 0x... | TBD | 0 |
| Base Mainnet | 0x... | TBD | 0 |
| Shape Mainnet | 0x... | TBD | 0 |
```

### Network-Specific Analytics

Consider tracking metrics per network:
- Total mints per network
- Active users per network
- Most popular network
- Network switch frequency

---

## 🚨 Troubleshooting

### Issue: "Contract not found"

**Cause**: Network-specific env variable not set

**Solution**:
```bash
# Check your .env
echo $NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT

# If empty, set it
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8
```

### Issue: "Wrong network" errors

**Cause**: User on unsupported network

**Solution**: Add network detection UI
```typescript
const { isSupported, networkName } = useNetworkContract()

if (!isSupported) {
  return <div>Please switch to Base Sepolia or Shape Sepolia</div>
}
```

### Issue: Gallery empty on one network

**Cause**: No NFTs minted on that network yet

**Solution**: Each network has separate NFTs
- Base Sepolia NFTs ≠ Shape Sepolia NFTs
- Users need to mint on each network separately

---

## ✅ Verification Checklist

- [ ] Environment variables set for each network
- [ ] Alchemy API key has access to all networks
- [ ] WalletConnect supports all chains
- [ ] Frontend detects network changes
- [ ] Contract addresses correct for each network
- [ ] Gallery shows correct NFTs per network
- [ ] Marketplace works on each network
- [ ] Users can switch networks seamlessly

---

## 📚 Reference Files

- **Configuration**: `lib/config.ts`
- **Web3 Setup**: `lib/web3.ts`
- **Network Hook**: `hooks/use-network-contract.ts`
- **Providers**: `components/providers.tsx`
- **Alchemy API**: `app/api/alchemy/route.ts`
- **Deploy Scripts**: 
  - `script/DeployBaseSepolia.s.sol`
  - `script/DeployShapeSepolia.s.sol`

---

## 🎉 Summary

Your OnchainRugs app now supports **true multi-network operation**:

✅ **Automatic network detection**  
✅ **Separate contracts per network**  
✅ **Seamless network switching**  
✅ **Network-specific contract addresses**  
✅ **Correct Alchemy API routing**  
✅ **Support for 4 networks (2 active, 2 ready)**  

Deploy to any network, set the env variable, and users can access it automatically! 🚀

---

**Last Updated**: October 28, 2025  
**Current Deployment**: Base Sepolia - `0xa43532205Fc90b286Da98389a9883347Cc4064a8`

