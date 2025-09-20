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
                process.env.ONCHAIN_RUGS_CONTRACT || '0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459',
    scriptyStorage: process.env.NEXT_PUBLIC_SCRIPTY_STORAGE ||
                   process.env.SCRIPTY_STORAGE || '0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459',
    scriptyBuilder: process.env.NEXT_PUBLIC_SCRIPTY_BUILDER ||
                   process.env.SCRIPTY_BUILDER || '0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459',
    htmlGenerator: process.env.NEXT_PUBLIC_HTML_GENERATOR ||
                  process.env.HTML_GENERATOR || '0xa46228a11e6C79f4f5D25038a3b712EBCB8F3459',
  },

  // 🔓 SAFE TO EXPOSE - Legacy contract address references (public blockchain data)
  rugContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ||
                     process.env.ONCHAIN_RUGS_CONTRACT || '0x73db032918FAEb5c853045cF8e9F70362738a8ee',
  cleaningContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT ||
                          process.env.ONCHAIN_RUGS_CONTRACT || '0x73db032918FAEb5c853045cF8e9F70362738a8ee',
  
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
    maxSupply: 1111,
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
  
  // Aging system
  aging: {
    dirtAppearanceDays: 3,
    fullDirtDays: 7,
    textureAppearanceDays: 30, // Updated: moderate texture at 30 days
    fullTextureDays: 90, // Updated: full texture at 90 days
    freeCleaningDays: 30,
    dirtAccumulation: {
      light: 3 * 24 * 60 * 60, // 3 days in seconds
      heavy: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    textureAging: {
      moderate: 30 * 24 * 60 * 60, // 30 days in seconds (updated)
      intense: 90 * 24 * 60 * 60, // 90 days in seconds (updated)
    },
    cleaningCosts: {
      free: 0,
      paid: 0.0009, // ETH (updated)
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
