// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createPublicClient, http, parseAbi } = require('viem')
const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

// Contract ABI for basic functions
const contractABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function rugs(uint256) view returns (uint256,string,string,string,string[],uint8,uint256,string,uint8,uint256,uint256)',
  'function ownerOf(uint256) view returns (address)',
  'function tokenURI(uint256) view returns (string)'
])

async function testComprehensive() {
  console.log('🔍 COMPREHENSIVE ANALYSIS: Contract vs Alchemy')
  console.log('=' .repeat(60))

  // Create public client for Shape Sepolia
  const publicClient = createPublicClient({
    chain: {
      id: 11011,
      name: 'Shape Sepolia',
      rpcUrls: {
        default: { http: ['https://sepolia.shape.network'] }
      }
    },
    transport: http('https://sepolia.shape.network')
  })

  try {
    console.log('\n📊 CONTRACT DATA ANALYSIS')
    console.log('-'.repeat(30))

    // Get basic contract info
    const name = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'name'
    })
    console.log(`✅ Contract Name: ${name}`)

    const totalSupply = Number(await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'totalSupply'
    }))
    console.log(`✅ Total Supply: ${totalSupply}`)

    const maxSupply = Number(await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'maxSupply'
    }))
    console.log(`✅ Max Supply: ${maxSupply}`)

    console.log('\n🔍 INDIVIDUAL NFT ANALYSIS')
    console.log('-'.repeat(30))

    // Check each NFT from 1 to totalSupply
    for (let i = 1; i <= Math.min(totalSupply, 15); i++) {
      try {
        console.log(`\n🆔 NFT #${i}:`)

        // Check if token exists
        const owner = await publicClient.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'ownerOf',
          args: [BigInt(i)]
        })
        console.log(`   👤 Owner: ${owner}`)

        // Try to get tokenURI
        try {
          const tokenURI = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'tokenURI',
            args: [BigInt(i)]
          })
          console.log(`   🔗 TokenURI: ${tokenURI}`)
        } catch (uriError) {
          console.log(`   ❌ TokenURI Error: ${uriError.message}`)
        }

        // Try to get rug data (this is where ABI issues occur)
        try {
          const rugData = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'rugs',
            args: [BigInt(i)]
          })
          console.log(`   ✅ Rug Data: Available`)
          console.log(`   📊 Seed: ${rugData[0]}`)
          console.log(`   🎨 Palette: ${rugData[1]}`)
          console.log(`   🔢 Complexity: ${rugData[8]}`)
        } catch (rugError) {
          console.log(`   ❌ Rug Data Error: ${rugError.message}`)
        }

      } catch (tokenError) {
        console.log(`   ❌ Token ${i} Error: ${tokenError.message}`)
      }
    }

    console.log('\n🔮 ALCHEMY DATA ANALYSIS')
    console.log('-'.repeat(30))

    if (!alchemyApiKey) {
      console.log('❌ Alchemy API key not configured')
      return
    }

    // Test Alchemy collection fetch
    console.log('\n📋 Testing Alchemy Collection Fetch...')
    const collectionResponse = await fetch(
      `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&limit=20`
    )

    if (!collectionResponse.ok) {
      console.log(`❌ Alchemy Collection Error: ${collectionResponse.status}`)
      const errorText = await collectionResponse.text()
      console.log(`   Error details: ${errorText}`)
    } else {
      const collectionData = await collectionResponse.json()
      console.log(`✅ Alchemy Collection Response:`)
      console.log(`   📊 NFTs Found: ${collectionData.nfts?.length || 0}`)
      console.log(`   📄 Next Page Key: ${collectionData.nextToken || 'None'}`)

      if (collectionData.nfts && collectionData.nfts.length > 0) {
        console.log('\n🎯 ALCHEMY NFT DETAILS:')
        collectionData.nfts.forEach((nft, index) => {
          console.log(`\n🆔 NFT #${nft.tokenId} (Alchemy #${index + 1}):`)
          console.log(`   📝 Name: ${nft.metadata?.name || 'No name'}`)
          console.log(`   📝 Description: ${nft.metadata?.description || 'No description'}`)
          console.log(`   🖼️  Image: ${nft.metadata?.image ? 'Present' : 'Missing'}`)
          console.log(`   👥 Owners: ${nft.owners ? nft.owners.length : 0}`)
          console.log(`   ⏰ Mint Time: ${nft.mint?.timestamp ? new Date(nft.mint.timestamp * 1000).toISOString() : 'Unknown'}`)
          console.log(`   🎭 Attributes: ${nft.metadata?.attributes ? nft.metadata.attributes.length : 0} traits`)
        })
      }
    }

    console.log('\n📈 SUMMARY REPORT')
    console.log('='.repeat(60))
    console.log(`🔢 Contract Total Supply: ${totalSupply}`)
    console.log(`🎯 Expected NFTs: ${totalSupply}`)
    console.log(`❓ Missing Analysis: Need to compare Alchemy vs Contract data`)

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message)
  }
}

testComprehensive().catch(console.error)
