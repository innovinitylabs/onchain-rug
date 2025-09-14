const { createPublicClient, http, parseAbi } = require('viem')
const { shapeSepolia, contractAddresses, appConfig } = require('../lib/web3.ts')

// Contract ABI for basic functions
const contractABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function calculateMintingPrice(string[] memory textRows) view returns (uint256)',
  'function BASE_PRICE() view returns (uint256)'
])

async function testContract() {
  console.log('🔍 Testing contract accessibility...')
  
  const contractAddress = contractAddresses[shapeSepolia.id] || appConfig.contracts.onchainRugs
  if (!contractAddress) {
    console.error('❌ Contract address not found in configuration')
    return
  }

  console.log(`📋 Contract address: ${contractAddress}`)
  console.log(`🌐 RPC URL: ${shapeSepolia.rpcUrls.default.http[0]}`)
  
  // Create public client for Shape Sepolia
  const publicClient = createPublicClient({
    chain: shapeSepolia,
    transport: http(shapeSepolia.rpcUrls.default.http[0])
  })
  
  try {
    console.log('🔄 Testing basic contract functions...')
    
    // Test contract name
    try {
      const name = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'name'
      })
      console.log(`✅ Contract name: ${name}`)
    } catch (err) {
      console.log(`❌ Failed to read contract name: ${err.message}`)
    }
    
    // Test contract symbol
    try {
      const symbol = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'symbol'
      })
      console.log(`✅ Contract symbol: ${symbol}`)
    } catch (err) {
      console.log(`❌ Failed to read contract symbol: ${err.message}`)
    }
    
    // Test total supply
    try {
      const totalSupply = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'totalSupply'
      })
      console.log(`✅ Total supply: ${totalSupply.toString()}`)
    } catch (err) {
      console.log(`❌ Failed to read total supply: ${err.message}`)
    }
    
    // Test base price
    try {
      const basePrice = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'BASE_PRICE'
      })
      console.log(`✅ Base price: ${basePrice.toString()} wei`)
    } catch (err) {
      console.log(`❌ Failed to read base price: ${err.message}`)
    }
    
    // Test pricing calculation
    try {
      const price = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'calculateMintingPrice',
        args: [['TEST']] // Test with one text line
      })
      console.log(`✅ Minting price for 1 line: ${price.toString()} wei`)
    } catch (err) {
      console.log(`❌ Failed to calculate minting price: ${err.message}`)
    }
    
    console.log('✅ Contract test completed!')
    
  } catch (err) {
    console.error(`❌ Contract test failed: ${err.message}`)
    console.error(`❌ Error details: ${err}`)
  }
}

// Run the test
testContract().catch(console.error)
