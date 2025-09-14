const { createPublicClient, http, parseAbi } = require('viem')

// Contract configuration
const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const rpcUrl = 'https://sepolia.shape.network'

// Contract ABI for basic functions
const contractABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function rugs(uint256) view returns (uint256,string,string,string,string[],uint8,uint256,string,uint8,uint256,uint256)',
  'function ownerOf(uint256) view returns (address)'
])

async function testContract() {
  console.log('🔍 Testing contract accessibility...')
  console.log(`📋 Contract address: ${contractAddress}`)
  console.log(`🌐 RPC URL: ${rpcUrl}`)

  // Create public client for Shape Sepolia
  const publicClient = createPublicClient({
    chain: {
      id: 11011,
      name: 'Shape Sepolia',
      rpcUrls: {
        default: { http: [rpcUrl] }
      }
    },
    transport: http(rpcUrl)
  })

  try {
    console.log('🔄 Testing basic contract functions...')

    // Test basic functions
    const name = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'name'
    })
    console.log(`✅ Contract name: ${name}`)

    const symbol = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'symbol'
    })
    console.log(`✅ Contract symbol: ${symbol}`)

    const totalSupply = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'totalSupply'
    })
    console.log(`✅ Total supply: ${totalSupply}`)

    const maxSupply = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'maxSupply'
    })
    console.log(`✅ Max supply: ${maxSupply}`)

    // Test first NFT data if totalSupply > 0
    if (totalSupply > 0) {
      console.log('🔄 Testing NFT data retrieval...')

      try {
        console.log('🔄 Testing individual fields first...')

        // Test ownerOf first
        const owner = await publicClient.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'ownerOf',
          args: [1]
        })
        console.log(`✅ NFT 1 owner: ${owner}`)

        // Try to get rug data with more detailed error handling
        console.log('🔄 Testing rug data with different approaches...')

        // Try getting rug data
        const rugData = await publicClient.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'rugs',
          args: [1]
        })
        console.log(`✅ NFT 1 data retrieved:`, JSON.stringify(rugData, null, 2))

      } catch (nftError) {
        console.error(`❌ Error retrieving NFT data:`, nftError.message)
        console.error('Full error:', nftError)

        // Try a simpler test - check if token exists
        try {
          console.log('🔄 Testing if token exists...')
          const ownerCheck = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'ownerOf',
            args: [1]
          })
          console.log(`✅ Token 1 exists, owner: ${ownerCheck}`)
        } catch (ownerError) {
          console.error(`❌ Token 1 does not exist:`, ownerError.message)
        }
      }
    } else {
      console.log('⚠️ No NFTs minted yet (totalSupply = 0)')
    }

    console.log('🎉 Contract test completed successfully!')

  } catch (error) {
    console.error('❌ Contract test failed:', error.message)

    if (error.message.includes('ContractFunctionExecutionError')) {
      console.error('🔍 This suggests the contract may not be deployed or the function signatures are incorrect')
    }

    if (error.message.includes('NetworkError')) {
      console.error('🔍 This suggests network connectivity issues')
    }

    if (error.message.includes('AddressError')) {
      console.error('🔍 This suggests the contract address is invalid')
    }
  }
}

testContract().catch(console.error)
