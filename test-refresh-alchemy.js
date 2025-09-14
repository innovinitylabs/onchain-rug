// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function refreshContractCache() {
  console.log('🔄 REFRESHING ALCHEMY CONTRACT CACHE')
  console.log('=' .repeat(60))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('📋 Contract:', contractAddress)
    console.log('🔑 API Key:', alchemyApiKey.substring(0, 10) + '...')

    // Try to invalidate contract cache
    console.log('\\n🗑️  Invalidating contract cache...')
    const invalidateResponse = await fetch(
      `${alchemyBaseUrl}/${alchemyApiKey}/invalidateContract`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: contractAddress,
          network: 'shape-sepolia'
        })
      }
    )

    console.log('Invalidate response status:', invalidateResponse.status)
    if (invalidateResponse.ok) {
      const result = await invalidateResponse.json()
      console.log('✅ Contract cache invalidated:', result)
    } else {
      const errorText = await invalidateResponse.text()
      console.log('⚠️  Could not invalidate cache:', errorText)
    }

    // Try to get current contract metadata
    console.log('\\n📊 Getting current contract metadata...')
    const metadataResponse = await fetch(
      `${alchemyBaseUrl}/${alchemyApiKey}/getContractMetadata?contractAddress=${contractAddress}`
    )

    if (metadataResponse.ok) {
      const metadata = await metadataResponse.json()
      console.log('📋 Contract metadata:', metadata)
    } else {
      console.log('❌ Could not get contract metadata')
    }

    // Wait a bit and try to get NFT data again
    console.log('\\n⏳ Waiting 5 seconds for cache refresh...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('\\n🔍 Testing NFT collection fetch after refresh...')
    const collectionResponse = await fetch(
      `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&limit=5`
    )

    if (collectionResponse.ok) {
      const collectionData = await collectionResponse.json()
      console.log('✅ Post-refresh collection data:')
      console.log('📊 NFTs found:', collectionData.nfts?.length || 0)

      if (collectionData.nfts && collectionData.nfts.length > 0) {
        console.log('\\n🎯 Sample NFT data:')
        const sampleNft = collectionData.nfts[0]
        console.log('Token ID:', sampleNft.tokenId)
        console.log('Has metadata:', !!sampleNft.metadata)
        console.log('Has owners:', !!sampleNft.owners)
        console.log('Raw NFT data:', JSON.stringify(sampleNft, null, 2))
      }
    } else {
      console.log('❌ Collection fetch failed after refresh')
    }

    console.log('\\n🎉 Cache refresh attempt completed!')

  } catch (error) {
    console.error('❌ Refresh failed:', error.message)
  }
}

refreshContractCache()
