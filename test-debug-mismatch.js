// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function debugMismatch(tokenId) {
  console.log(`🔍 DEBUGGING MISMATCH FOR TOKEN #${tokenId}`)
  console.log('='.repeat(80))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)

    // Get individual metadata (same as gallery)
    const individualUrl = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    console.log('\\n📡 Individual metadata URL:', individualUrl)

    const response = await fetch(individualUrl)
    console.log('Response Status:', response.status)
    console.log('Response OK:', response.ok)

    if (!response.ok) {
      console.error('❌ Individual metadata request failed')
      return
    }

    const metadata = await response.json()

    console.log('\\n🔍 DIRECT ANALYSIS:')
    console.log('='.repeat(30))
    console.log('Token ID:', metadata.tokenId)
    console.log('Name:', metadata.name)
    console.log('Description:', metadata.description)

    console.log('\\n🎨 MEDIA FIELDS:')
    console.log('metadata.animation_url:', !!metadata.animation_url)
    console.log('metadata.image:', !!metadata.image)
    console.log('metadata.animation:', !!metadata.animation)
    console.log('metadata.animation?.cachedUrl:', !!metadata.animation?.cachedUrl)
    console.log('metadata.animation?.originalUrl:', !!metadata.animation?.originalUrl)

    console.log('\\n📊 RAW ANIMATION VALUES:')
    console.log('animation_url:', metadata.animation_url)
    console.log('animation.cachedUrl:', metadata.animation?.cachedUrl)
    console.log('animation.originalUrl:', metadata.animation?.originalUrl)

    console.log('\\n🔗 RAW IMAGE VALUES:')
    console.log('image:', metadata.image)
    console.log('image.cachedUrl:', metadata.image?.cachedUrl)
    console.log('image.originalUrl:', metadata.image?.originalUrl)

    console.log('\\n📋 ATTRIBUTES:')
    console.log('metadata.attributes length:', metadata.metadata?.attributes?.length || 0)

    if (metadata.metadata?.attributes) {
      metadata.metadata.attributes.forEach((attr, index) => {
        console.log(`  ${index + 1}. ${attr.trait_type}: ${attr.value}`)
      })
    }

    // Simulate how gallery merges data
    console.log('\\n🔄 SIMULATING GALLERY MERGE:')
    console.log('='.repeat(40))

    // Mock collection NFT data (what gallery gets first)
    const mockCollectionNft = {
      tokenId: tokenId.toString(),
      owners: null,
      mint: { timestamp: null }
    }

    // Simulate the merge (same as gallery)
    const enrichedNft = { ...mockCollectionNft, ...metadata }

    console.log('After merge:')
    console.log('  tokenId:', enrichedNft.tokenId)
    console.log('  name:', enrichedNft.name)
    console.log('  description:', enrichedNft.description)
    console.log('  animation_url:', enrichedNft.animation_url)
    console.log('  image:', enrichedNft.image)
    console.log('  owners:', enrichedNft.owners)

    // Check all possible animation fields
    const hasAnimation = !!(
      enrichedNft.animation_url ||
      enrichedNft.animation?.cachedUrl ||
      enrichedNft.animation?.originalUrl
    )

    console.log('\\n🎯 FINAL RESULT:')
    console.log('Has animation_url in merged data:', hasAnimation)
    console.log('Animation URL value:', enrichedNft.animation_url || enrichedNft.animation?.cachedUrl || enrichedNft.animation?.originalUrl || 'NONE')

    if (!hasAnimation) {
      console.log('\\n❌ PROBLEM IDENTIFIED!')
      console.log('The merged NFT data has no animation_url field.')
      console.log('This explains why the gallery shows no artwork.')
    } else {
      console.log('\\n✅ ANIMATION FOUND!')
      console.log('The gallery should work correctly.')
    }

  } catch (error) {
    console.error('❌ Failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

async function testMultipleTokens() {
  console.log('🧪 TESTING MULTIPLE TOKENS FOR MISMATCH')
  console.log('='.repeat(80))

  const tokensToTest = [1, 6, 7, 8, 9, 10, 11, 12]

  for (const tokenId of tokensToTest) {
    console.log(`\\n🎨 TOKEN #${tokenId}`)
    console.log('-'.repeat(50))
    await debugMismatch(tokenId)
  }

  console.log('\\n🎉 MULTI-TOKEN TEST COMPLETE')
  console.log('='.repeat(80))
}

testMultipleTokens()
