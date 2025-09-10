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
    onchainRugs: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || '',
  },
  
  // Legacy contract address references
  rugContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || '',
  cleaningContractAddress: process.env.NEXT_PUBLIC_ONCHAIN_RUGS_CONTRACT || '',
  
  // Network configuration
  networks: {
    shapeSepolia: {
      chainId: 11011,
      name: 'Shape Sepolia',
      rpcUrl: 'https://rpc-shape-sepolia.alt.technology',
    },
    shapeMainnet: {
      chainId: 11011,
      name: 'Shape Mainnet', 
      rpcUrl: 'https://rpc-shape.alt.technology',
    },
  },
  
  // Default chain ID
  chainId: 11011, // Shape Sepolia
  
  // Minting configuration
  minting: {
    maxSupply: 1111,
    freeMintLines: 1,
    basePrice: '0', // Free minting
    additionalLinePrices: {
      lines2to3: 0.00111, // ETH
      lines4to5: 0.00222, // ETH
    },
    textPricing: {
      line2: '1110000000000000', // 0.00111 ETH in wei
      line4: '2220000000000000', // 0.00222 ETH in wei
    },
    cleaningCost: 0.001, // ETH for cleaning after 30 days
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
    textureAppearanceDays: 7,
    fullTextureDays: 30,
    freeCleaningDays: 30,
    dirtAccumulation: {
      light: 3 * 24 * 60 * 60, // 3 days in seconds
      heavy: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    textureAging: {
      moderate: 7 * 24 * 60 * 60, // 7 days in seconds
      intense: 30 * 24 * 60 * 60, // 30 days in seconds
    },
    cleaningCosts: {
      free: 0,
      paid: 0.001, // ETH
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
