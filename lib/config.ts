/**
 * Application configuration
 */

export const config = {
  // 🔓 SAFE TO EXPOSE - WalletConnect Project ID (public identifier)
  // Supports both NEXT_PUBLIC_ prefix and direct naming for Vercel compatibility
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
                         process.env.WALLET_CONNECT_PROJECT_ID || '',

  // 🔓 SAFE TO EXPOSE - Alchemy API Key (for enhanced RPC functionality)
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ||
                 process.env.ALCHEMY_API_KEY || '',

  // 🔓 SAFE TO EXPOSE - Contract addresses (public blockchain data)
  contracts: {
    onchainRugs: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ||
                process.env.ONCHAIN_RUGS_CONTRACT || '0xa7e2c645E9332900b09c627c88b15Cc0b0fAcDc0',
    scriptyStorage: process.env.NEXT_PUBLIC_SCRIPTY_STORAGE ||
                   process.env.SCRIPTY_STORAGE || '0xF7134668cea698fC713582B5B6bfe33Ab8227a5e',
    scriptyBuilder: process.env.NEXT_PUBLIC_SCRIPTY_BUILDER ||
                   process.env.SCRIPTY_BUILDER || '0x1F2b94753D5717400c6DA24D7c8058B4C20015F8',
    htmlGenerator: process.env.NEXT_PUBLIC_HTML_GENERATOR ||
                  process.env.HTML_GENERATOR || '0x02998E64852C50F151d738ef486A599c796A3bc7',
  },

  // 🔓 SAFE TO EXPOSE - Legacy contract address references (public blockchain data)
  rugContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ||
                     process.env.ONCHAIN_RUGS_CONTRACT || '0xa7e2c645E9332900b09c627c88b15Cc0b0fAcDc0',
  cleaningContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ||
                          process.env.ONCHAIN_RUGS_CONTRACT || '0xa7e2c645E9332900b09c627c88b15Cc0b0fAcDc0',
  
  // Network configuration
  networks: {
    shapeSepolia: {
      chainId: 11011,
      name: 'Shape Sepolia',
      rpcUrl: 'https://sepolia.shape.network',
    },
    shapeMainnet: {
      chainId: 360,
      name: 'Shape Mainnet', 
      rpcUrl: 'https://mainnet.shape.network',
    },
  },
  
  // Default chain ID
  chainId: 11011, // Shape Sepolia
  
  // Minting configuration
  minting: {
    maxSupply: 10000,
    basePrice: '100000000000', // 0.0000001 ETH in wei (base price for any mint)
    additionalLinePrices: {
      lines2to3: 0.0000001, // ETH (additional for lines 2-3)
      lines4to5: 0.0000001, // ETH (additional for lines 4-5)
    },
    textPricing: {
      line2: '100000000000', // 0.0000001 ETH in wei
      line4: '100000000000', // 0.0000001 ETH in wei
    },
    cleaningCost: 0.0000001, // ETH for cleaning after 30 days (low for testing)
  },
  
  // Art generation
  art: {
    canvasWidth: 800,
    canvasHeight: 1200,
    frameRate: 30,
    defaultWarpThickness: 8,
  },
  
  // Aging system (now using minutes instead of days for faster testing)
  aging: {
    dirtAppearanceDays: 3,
    fullDirtDays: 7,
    textureAppearanceDays: 30, // Updated: moderate texture at 30 minutes
    fullTextureDays: 90, // Updated: full texture at 90 minutes
    freeCleaningDays: 30,
    dirtAccumulation: {
      light: 3 * 60, // 3 minutes in seconds (changed from 3 days)
      heavy: 7 * 60, // 7 minutes in seconds (changed from 7 days)
    },
    textureAging: {
      moderate: 30 * 60, // 30 minutes in seconds (changed from 30 days)
      intense: 90 * 60, // 90 minutes in seconds (changed from 90 days)
    },
    cleaningCosts: {
      free: 0,
      paid: '900000000000000', // 0.0009 ETH in wei
    },
  },
  
  // 🔓 SAFE TO EXPOSE - Royalties (public wallet address)
  royalties: {
    percentage: 10, // 10%
    recipient: process.env.NEXT_PUBLIC_ROYALTY_RECIPIENT ||
              process.env.ROYALTY_RECIPIENT || '',
  },
}

// Export configs separately for convenience
export const agingConfig = config.aging
export const mintingConfig = config.minting

export default config
