// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function testGalleryAPICall() {
  console.log('🧪 TESTING GALLERY API CALL (EXACT SAME AS GALLERY)')
  console.log('=' .repeat(70))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)
    console.log('🌐 URL:', alchemyBaseUrl)

    // This is EXACTLY what the gallery is doing
    console.log('\\n🔄 Making the exact same API call as gallery...')
    const url = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&limit=20`
    console.log('📡 Full URL:', url)

    const response = await fetch(url)

    console.log('📡 Response Status:', response.status)
    console.log('📡 Response OK:', response.ok)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers))

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Response Error:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ Response Data Structure:')
    console.log('📊 NFTs array length:', data.nfts?.length || 0)
    console.log('📊 Has pageKey:', !!data.pageKey)
    console.log('📊 Full data keys:', Object.keys(data))

    if (data.nfts && data.nfts.length > 0) {
      console.log('\\n🎯 First NFT analysis:')
      const firstNft = data.nfts[0]
      console.log('Token ID:', firstNft.tokenId)
      console.log('Has metadata:', !!firstNft.metadata)
      console.log('Has owners:', !!firstNft.owners)
      console.log('Has mint:', !!firstNft.mint)

      if (firstNft.metadata) {
        console.log('Metadata keys:', Object.keys(firstNft.metadata))
        console.log('Metadata name:', firstNft.metadata.name)
        console.log('Metadata description:', firstNft.metadata.description)
        console.log('Metadata attributes:', firstNft.metadata.attributes?.length || 0)
      } else {
        console.log('❌ No metadata found!')
      }

      console.log('Raw NFT data:', JSON.stringify(firstNft, null, 2))
    } else {
      console.log('❌ No NFTs in response!')
    }

  } catch (error) {
    console.error('❌ API Call failed:', error.message)
  }
}

testGalleryAPICall()
