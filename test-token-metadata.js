// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function getTokenMetadata(tokenId) {
  console.log(`🎯 GETTING METADATA FOR TOKEN #${tokenId}`)
  console.log('=' .repeat(50))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)

    // Get individual NFT metadata
    const response = await fetch(
      `${alchemyBaseUrl}/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    )

    if (!response.ok) {
      console.error('❌ Metadata fetch failed:', response.status)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const metadata = await response.json()
    console.log('✅ Raw metadata for token:', JSON.stringify(metadata, null, 2))

    // Extract key information
    console.log('\\n🔍 KEY METADATA EXTRACTION:')
    console.log('Name:', metadata.metadata?.name)
    console.log('Description:', metadata.metadata?.description)
    console.log('Image:', metadata.metadata?.image)
    console.log('Animation URL:', metadata.metadata?.animation_url)

    console.log('\\n📊 ATTRIBUTES:')
    const attributes = metadata.metadata?.attributes || []
    attributes.forEach(attr => {
      console.log(`${attr.trait_type}: ${attr.value}`)
    })

    console.log('\\n🔗 RAW ANIMATION_URL:')
    console.log(metadata.metadata?.animation_url)

    return metadata

  } catch (error) {
    console.error('❌ Failed to get metadata:', error.message)
  }
}

async function testMultipleTokens() {
  console.log('🧪 TESTING METADATA FOR TOKENS 6-12')
  console.log('=' .repeat(60))

  const tokensToTest = [6, 7, 8, 9, 10, 11, 12]

  for (const tokenId of tokensToTest) {
    console.log(`\\n🎨 TOKEN #${tokenId}`)
    console.log('-'.repeat(30))
    const metadata = await getTokenMetadata(tokenId)

    if (metadata?.metadata?.animation_url) {
      console.log('✅ Has animation_url - this is our template!')
      return metadata
    }
  }

  console.log('❌ No tokens with animation_url found')
}

testMultipleTokens()
