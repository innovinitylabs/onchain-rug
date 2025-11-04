# ============================================
# OnchainRugs Environment Configuration
# ============================================

# Only API keys and contract addresses go here.
# Network metadata (chain IDs, RPC URLs, etc.) are now in code.

# ============================================
# REQUIRED: API KEYS
# ============================================

# Alchemy API Key (for all networks)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here

# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# ============================================
# OPTIONAL: Contract Addresses (per network)
# ============================================

# Only set these if you have deployed contracts to specific networks
# If not set, the app will show "unsupported network" for that chain

# Shape Sepolia Testnet (Chain ID: 11011)
# NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=0x...

# Shape Mainnet (Chain ID: 360)
# NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT=0x...

# Base Sepolia Testnet (Chain ID: 84532)
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# Base Mainnet (Chain ID: 8453)
# NEXT_PUBLIC_BASE_MAINNET_CONTRACT=0x...

# Fallback contract (used if network-specific contract not set)
NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT=0xa43532205Fc90b286Da98389a9883347Cc4064a8

# ============================================
# OPTIONAL: Default Chain ID
# ============================================

# Which network to default to (defaults to Base Sepolia if not set)
# NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532

# ============================================
# OPTIONAL: Royalties
# ============================================

# Royalty recipient wallet address
# NEXT_PUBLIC_ROYALTY_RECIPIENT=your_wallet_address

# Relay Integration

# Use testnet API for development (Ethereum Sepolia, Base Sepolia, etc.)
# Set to "true" for testing with testnets, "false" or omit for mainnet
NEXT_PUBLIC_RELAY_USE_TESTNET=true

# Optional override for Relay API base URL
# Defaults: https://api.testnets.relay.link (if testnet) or https://api.relay.link (mainnet)
# NEXT_PUBLIC_RELAY_API_BASE=

# Select destination Shape network for mint execution
# Allowed: sepolia | mainnet (defaults to sepolia if not set)
NEXT_PUBLIC_SHAPE_TARGET=sepolia

# Destination contracts (if not already set via NEXT_PUBLIC_*_CONTRACT)
# NEXT_PUBLIC_SHAPE_SEPOLIA_CONTRACT=
# NEXT_PUBLIC_SHAPE_MAINNET_CONTRACT=
