// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function testGalleryData() {
  console.log('🎨 TESTING GALLERY DATA PROCESSING')
  console.log('=' .repeat(50))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)

    // Fetch collection data from Alchemy (same as gallery)
    console.log('\\n📡 Fetching from Alchemy...')
    const response = await fetch(
      `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=true&limit=20`
    )

    if (!response.ok) {
      console.error('❌ Alchemy fetch failed:', response.status)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const alchemyData = await response.json()
    console.log('✅ Alchemy response received')
    console.log('📊 NFTs found:', alchemyData.nfts?.length || 0)

    // Simulate the gallery processing logic
    console.log('\\n🔄 Processing NFTs (simulating gallery logic)...')

    if (alchemyData.nfts && Array.isArray(alchemyData.nfts)) {
      console.log('🎯 Processing', alchemyData.nfts.length, 'NFTs from Alchemy')

      alchemyData.nfts.forEach((nft, index) => {
        console.log(`\\n🆔 NFT #${nft.tokenId} (index ${index}):`, {
          name: nft.metadata?.name,
          description: nft.metadata?.description,
          attributes: nft.metadata?.attributes?.length || 0,
          hasMetadata: !!nft.metadata,
          owners: nft.owners
        })

        try {
          // Extract traits from metadata attributes (same as gallery)
          const attributes = nft.metadata?.attributes || []
          const traits = {
            seed: BigInt(nft.tokenId || 0),
            paletteName: attributes.find(a => a.trait_type === 'Palette Name')?.value || '',
            minifiedPalette: '', // Not available from Alchemy
            minifiedStripeData: '', // Not available from Alchemy
            textRows: [], // Not available from Alchemy
            warpThickness: Number(attributes.find(a => a.trait_type === 'Warp Thickness')?.value || 0),
            mintTime: BigInt(nft.mint?.timestamp || 0),
            filteredCharacterMap: '', // Not available from Alchemy
            complexity: Number(attributes.find(a => a.trait_type === 'Complexity')?.value || 0),
            characterCount: BigInt(attributes.find(a => a.trait_type === 'Character Count')?.value || 0),
            stripeCount: BigInt(attributes.find(a => a.trait_type === 'Stripe Count')?.value || 0),
          }

          const nftItem = {
            tokenId: Number(nft.tokenId),
            traits,
            owner: nft.owners ? nft.owners[0] : '', // Primary owner
            rarityScore: 0, // Simplified for testing
          }

          console.log('✅ Processed NFT:', {
            tokenId: nftItem.tokenId,
            owner: nftItem.owner,
            paletteName: traits.paletteName,
            complexity: traits.complexity,
            characterCount: Number(traits.characterCount),
            stripeCount: Number(traits.stripeCount)
          })

        } catch (error) {
          console.warn(`❌ Error processing NFT ${nft.tokenId}:`, error.message)
        }
      })
    }

    console.log('\\n🎉 Gallery simulation completed!')
    console.log('📈 Summary:', {
      totalNfts: alchemyData.nfts?.length || 0,
      allHaveMetadata: alchemyData.nfts?.every(nft => nft.metadata) || false,
      allHaveAttributes: alchemyData.nfts?.every(nft => nft.metadata?.attributes?.length > 0) || false
    })

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGalleryData()
