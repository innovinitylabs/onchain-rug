// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function comprehensiveGalleryTest() {
  console.log('🧪 COMPREHENSIVE GALLERY TEST')
  console.log('='.repeat(80))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)
    console.log('🌐 URL:', alchemyBaseUrl)

    // Step 1: Test collection endpoint (same as gallery)
    console.log('\\n📡 STEP 1: Testing collection endpoint...')
    const collectionUrl = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&limit=20`
    console.log('Collection URL:', collectionUrl)

    const collectionResponse = await fetch(collectionUrl)
    console.log('Collection Response Status:', collectionResponse.status)
    console.log('Collection Response OK:', collectionResponse.ok)

    if (!collectionResponse.ok) {
      const errorText = await collectionResponse.text()
      console.error('Collection Error:', errorText)
      return
    }

    const collectionData = await collectionResponse.json()
    console.log('Collection NFTs found:', collectionData.nfts?.length || 0)

    if (!collectionData.nfts || collectionData.nfts.length === 0) {
      console.log('❌ No NFTs in collection response')
      return
    }

    // Step 2: Analyze metadata for each NFT
    console.log('\\n📊 STEP 2: Analyzing NFT metadata...')
    collectionData.nfts.forEach((nft, index) => {
      console.log(`\\n🆔 NFT #${nft.tokenId} (index ${index}):`)
      console.log('  - Has metadata object:', !!nft.metadata)
      console.log('  - Has name:', !!nft.name)
      console.log('  - Has description:', !!nft.description)
      console.log('  - Has animation_url:', !!nft.animation_url)
      console.log('  - Has image:', !!nft.image)
      console.log('  - Has attributes:', !!(nft.metadata?.attributes?.length > 0))

      if (nft.metadata?.attributes) {
        console.log('  - Attributes count:', nft.metadata.attributes.length)
        nft.metadata.attributes.forEach(attr => {
          console.log(`    ${attr.trait_type}: ${attr.value}`)
        })
      }
    })

    // Step 3: Simulate gallery processing
    console.log('\\n🔄 STEP 3: Simulating gallery processing...')
    const simulatedNFTData = []

    collectionData.nfts.forEach((nft, index) => {
      try {
        console.log(`\\nProcessing NFT #${nft.tokenId}:`)

        // Extract traits from metadata attributes (same as gallery)
        const attributes = nft.metadata?.attributes || []
        console.log('  - Found attributes:', attributes.length)

        const traits = {
          seed: BigInt(nft.tokenId || 0),
          paletteName: attributes.find((a) => a.trait_type === 'Palette Name')?.value || 'Default Palette',
          minifiedPalette: '',
          minifiedStripeData: '',
          textRows: [],
          warpThickness: Number(attributes.find((a) => a.trait_type === 'Warp Thickness')?.value || 3),
          mintTime: nft.mint?.timestamp ? BigInt(new Date(nft.mint.timestamp).getTime()) : BigInt(Date.now()),
          filteredCharacterMap: '',
          complexity: Number(attributes.find((a) => a.trait_type === 'Complexity')?.value || 2),
          characterCount: BigInt(attributes.find((a) => a.trait_type === 'Character Count')?.value || 1),
          stripeCount: BigInt(attributes.find((a) => a.trait_type === 'Stripe Count')?.value || 0),
        }

        const nftItem = {
          tokenId: Number(nft.tokenId),
          traits,
          owner: nft.owners ? nft.owners[0] : '',
          rarityScore: 0,
          name: nft.name,
          description: nft.description,
          image: nft.image,
          animation_url: nft.animation_url
        }

        simulatedNFTData.push(nftItem)
        console.log('  ✅ Successfully processed NFT:', {
          tokenId: nftItem.tokenId,
          name: nftItem.name,
          animation_url: !!nftItem.animation_url,
          owner: nftItem.owner,
          traitsCount: Object.keys(traits).length
        })

      } catch (error) {
        console.warn(`  ❌ Error processing NFT ${nft.tokenId}:`, error.message)
      }
    })

    console.log('\\n🎉 SIMULATION COMPLETE')
    console.log('='.repeat(80))
    console.log('Summary:')
    console.log('  - Total NFTs from Alchemy:', collectionData.nfts.length)
    console.log('  - Successfully processed:', simulatedNFTData.length)
    console.log('  - NFTs with animation_url:', simulatedNFTData.filter(nft => nft.animation_url).length)
    console.log('  - NFTs with metadata:', simulatedNFTData.filter(nft => nft.name && nft.description).length)

    // Test if any NFT has animation_url
    const nftsWithArt = simulatedNFTData.filter(nft => nft.animation_url)
    if (nftsWithArt.length > 0) {
      console.log('\\n🎨 NFTs with artwork:')
      nftsWithArt.slice(0, 3).forEach(nft => {
        console.log(`  - #${nft.tokenId}: ${nft.name}`)
        console.log(`    Animation URL: ${nft.animation_url.substring(0, 50)}...`)
      })
    } else {
      console.log('\\n⚠️  No NFTs found with animation_url')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

comprehensiveGalleryTest()
