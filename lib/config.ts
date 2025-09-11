/**
 * Application configuration
 */

export const config = {
  // Wallet Connect Project ID
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  
  // Alchemy API Key
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
  
  // Contract addresses
  contracts: {
    onchainRugs: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || '0xa43eBb099aA98Bdf4d2E3c0172Cafd600e113249',
  },
  
  // Legacy contract address references
  rugContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || '0xa43eBb099aA98Bdf4d2E3c0172Cafd600e113249',
  cleaningContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || '0xa43eBb099aA98Bdf4d2E3c0172Cafd600e113249',
  
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
  
  // Royalties
  royalties: {
    percentage: 10, // 10%
    recipient: process.env.NEXT_PUBLIC_ROYALTY_RECIPIENT || '',
  },
}

// Export configs separately for convenience
export const agingConfig = config.aging
export const mintingConfig = config.minting

export default config
