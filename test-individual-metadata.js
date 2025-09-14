// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function testIndividualMetadata(tokenId) {
  console.log(`🎯 TESTING INDIVIDUAL METADATA FOR TOKEN #${tokenId}`)
  console.log('='.repeat(80))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)

    // Test individual NFT metadata endpoint
    const individualUrl = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    console.log('\\n📡 Individual metadata URL:', individualUrl)

    const response = await fetch(individualUrl)
    console.log('Response Status:', response.status)
    console.log('Response OK:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error:', errorText)
      return
    }

    const metadata = await response.json()
    console.log('\\n📊 INDIVIDUAL METADATA RESPONSE:')
    console.log('='.repeat(50))
    console.log(JSON.stringify(metadata, null, 2))

    console.log('\\n🔍 KEY ANALYSIS:')
    console.log('='.repeat(30))
    console.log('Contract Address:', metadata.contract?.address)
    console.log('Token ID:', metadata.tokenId)
    console.log('Token Type:', metadata.tokenType)
    console.log('Name:', metadata.name)
    console.log('Description:', metadata.description)

    console.log('\\n🎨 MEDIA ANALYSIS:')
    console.log('Image:', metadata.image?.cachedUrl || metadata.image?.originalUrl)
    console.log('Animation URL:', metadata.animation?.cachedUrl || metadata.animation?.originalUrl)

    console.log('\\n📋 ATTRIBUTES ANALYSIS:')
    console.log('Attributes Count:', metadata.metadata?.attributes?.length || 0)
    if (metadata.metadata?.attributes) {
      metadata.metadata.attributes.forEach((attr, index) => {
        console.log(`  ${index + 1}. ${attr.trait_type}: ${attr.value}`)
      })
    }

    console.log('\\n🔗 RAW ANIMATION_URL:')
    console.log(metadata.animation?.cachedUrl || metadata.animation?.originalUrl || 'NOT FOUND')

    return metadata

  } catch (error) {
    console.error('❌ Failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

async function testMultipleIndividualTokens() {
  console.log('🧪 TESTING MULTIPLE INDIVIDUAL TOKENS (6-12)')
  console.log('='.repeat(80))

  const tokensToTest = [6, 7, 8, 9, 10, 11, 12]
  const results = []

  for (const tokenId of tokensToTest) {
    console.log(`\\n🎨 TOKEN #${tokenId}`)
    console.log('-'.repeat(40))
    const metadata = await testIndividualMetadata(tokenId)

    if (metadata) {
      results.push({
        tokenId,
        hasAnimationUrl: !!(metadata.animation?.cachedUrl || metadata.animation?.originalUrl),
        attributesCount: metadata.metadata?.attributes?.length || 0,
        animationUrl: metadata.animation?.cachedUrl || metadata.animation?.originalUrl
      })
    }
  }

  console.log('\\n🎉 SUMMARY OF ALL TOKENS:')
  console.log('='.repeat(50))
  results.forEach(result => {
    console.log(`Token #${result.tokenId}:`)
    console.log(`  - Has animation_url: ${result.hasAnimationUrl}`)
    console.log(`  - Attributes count: ${result.attributesCount}`)
    if (result.animationUrl) {
      console.log(`  - Animation URL: ${result.animationUrl.substring(0, 60)}...`)
    }
  })

  const withArt = results.filter(r => r.hasAnimationUrl)
  const withAttrs = results.filter(r => r.attributesCount > 0)

  console.log('\\n📈 FINAL SUMMARY:')
  console.log(`  - Total tokens tested: ${results.length}`)
  console.log(`  - Tokens with animation_url: ${withArt.length}`)
  console.log(`  - Tokens with attributes: ${withAttrs.length}`)

  if (withArt.length > 0) {
    console.log('\\n✅ SOLUTION: Use individual metadata endpoint for artwork!')
  } else {
    console.log('\\n❌ PROBLEM: No tokens have animation_url even individually')
  }
}

testMultipleIndividualTokens()
