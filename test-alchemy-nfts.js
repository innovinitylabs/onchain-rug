// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

// Alchemy NFT API functions
async function getNftsForCollection(address, options = {}) {
  const { pageKey, limit = 100, withMetadata = true } = options
  const params = new URLSearchParams({
    withMetadata: withMetadata.toString(),
    ...(limit && { limit: limit.toString() }),
    ...(pageKey && { pageKey })
  })

  const url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${address}&${params}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Alchemy API error: ${response.status}`)
  return response.json()
}

async function getNftMetadata(address, tokenId, refreshCache = false) {
  const params = new URLSearchParams({
    ...(refreshCache && { refreshCache: 'true' })
  })

  const url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTMetadata?contractAddress=${address}&tokenId=${tokenId}&${params}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Alchemy API error: ${response.status}`)
  return response.json()
}

async function getContractMetadata(address) {
  const url = `${alchemyBaseUrl}/${alchemyApiKey}/getContractMetadata?contractAddress=${address}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Alchemy API error: ${response.status}`)
  return response.json()
}

async function testAlchemyNFTs() {
  console.log('🔍 Testing Alchemy NFT API...')
  console.log(`📋 Contract address: ${contractAddress}`)
  console.log(`🔑 API Key configured: ${!!alchemyApiKey}`)
  console.log(`🌐 Network: shape-sepolia`)

  if (!alchemyApiKey) {
    console.error('❌ Alchemy API key not configured')
    return
  }

  try {
    console.log('\n📊 Testing contract metadata...')
    const contractMetadata = await getContractMetadata(contractAddress)
    console.log('✅ Contract metadata:', contractMetadata)

    console.log('\n🎨 Testing NFT collection fetch...')
    const collectionData = await getNftsForCollection(contractAddress, {
      limit: 5,
      withMetadata: true
    })
    console.log('✅ Collection data:', JSON.stringify(collectionData, null, 2))

    if (collectionData.nfts && collectionData.nfts.length > 0) {
      console.log('\n🎯 Testing individual NFT metadata...')
      const firstNft = collectionData.nfts[0]
      console.log(`🔢 Testing NFT ID: ${firstNft.tokenId}`)

      const nftMetadata = await getNftMetadata(contractAddress, firstNft.tokenId)
      console.log('✅ NFT metadata:', JSON.stringify(nftMetadata, null, 2))
    }

    console.log('\n🎉 Alchemy NFT API test completed successfully!')

  } catch (error) {
    console.error('❌ Alchemy API test failed:', error.message)
    console.error('Full error:', error)

    if (error.message.includes('404')) {
      console.error('🔍 Contract not indexed by Alchemy or network not supported')
    } else if (error.message.includes('403')) {
      console.error('🔍 API key invalid or insufficient permissions')
    } else if (error.message.includes('429')) {
      console.error('🔍 Rate limit exceeded')
    }
  }
}

testAlchemyNFTs().catch(console.error)
