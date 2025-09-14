// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const contractAddress = '0xc960fd553fa4be19e0957bde9de113bB8E299187'
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
const alchemyBaseUrl = 'https://shape-sepolia.g.alchemy.com/nft/v3'

async function testGalleryFlow() {
  console.log('🎨 FINAL GALLERY TEST - COMPLETE FLOW')
  console.log('='.repeat(80))

  if (!alchemyApiKey) {
    console.error('❌ No Alchemy API key found')
    return
  }

  try {
    console.log('🔑 API Key present:', !!alchemyApiKey)
    console.log('📋 Contract:', contractAddress)
    console.log('🌐 URL:', alchemyBaseUrl)

    // Step 1: Get collection list (same as gallery)
    console.log('\\n📡 STEP 1: Getting collection list...')
    const collectionUrl = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTsForCollection?contractAddress=${contractAddress}&withMetadata=false&limit=20`
    const collectionResponse = await fetch(collectionUrl)

    if (!collectionResponse.ok) {
      console.error('❌ Collection request failed:', collectionResponse.status)
      return
    }

    const collectionData = await collectionResponse.json()
    console.log('✅ Collection NFTs:', collectionData.nfts?.length || 0)

    if (!collectionData.nfts || collectionData.nfts.length === 0) {
      console.log('❌ No NFTs in collection')
      return
    }

    // Step 2: Fetch individual metadata for each NFT (same as gallery)
    console.log('\\n📡 STEP 2: Fetching individual metadata...')
    const enrichedNfts = []

    for (const nft of collectionData.nfts || []) {
      console.log(`📋 Getting metadata for NFT #${nft.tokenId}...`)

      const metadataUrl = `${alchemyBaseUrl}/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${nft.tokenId}`
      const metadataResponse = await fetch(metadataUrl)

      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json()
        const enrichedNft = { ...nft, ...metadata }
        enrichedNfts.push(enrichedNft)

        console.log(`✅ NFT #${nft.tokenId}:`, {
          name: enrichedNft.name,
          description: enrichedNft.description?.substring(0, 50) + '...',
          animation_url: !!enrichedNft.animation_url,
          image: !!enrichedNft.image,
          owners: enrichedNft.owners?.length || 0
        })
      } else {
        console.log(`⚠️ Failed to get metadata for NFT #${nft.tokenId}`)
        enrichedNfts.push(nft)
      }
    }

    // Step 3: Process like gallery (simulate processing useEffect)
    console.log('\\n🔄 STEP 3: Simulating gallery processing...')
    const nftData = []

    enrichedNfts.forEach((nft, index) => {
      try {
        console.log(`Processing NFT #${nft.tokenId}...`)

        // Extract traits (same as gallery)
        const attributes = nft.metadata?.attributes || []
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
          name: nft.name || `OnchainRug #${nft.tokenId}`,
          description: nft.description || 'OnchainRugs by valipokkann',
          image: nft.image || '/logo.png',
          animation_url: nft.animation_url
        }

        nftData.push(nftItem)
        console.log(`✅ Added NFT #${nft.tokenId} to gallery:`, {
          hasAnimation: !!nftItem.animation_url,
          name: nftItem.name,
          owner: nftItem.owner
        })

      } catch (error) {
        console.warn(`❌ Error processing NFT ${nft.tokenId}:`, error.message)
      }
    })

    // Final summary
    console.log('\\n🎉 FINAL GALLERY TEST RESULTS')
    console.log('='.repeat(60))
    console.log('Collection NFTs found:', enrichedNfts.length)
    console.log('Successfully processed:', nftData.length)
    console.log('NFTs with animation_url:', nftData.filter(nft => nft.animation_url).length)
    console.log('NFTs with images:', nftData.filter(nft => nft.image).length)
    console.log('NFTs with owners:', nftData.filter(nft => nft.owner).length)

    const withArt = nftData.filter(nft => nft.animation_url)
    if (withArt.length > 0) {
      console.log('\\n🎨 NFTs ready for gallery:')
      withArt.slice(0, 5).forEach(nft => {
        console.log(`  - #${nft.tokenId}: ${nft.name} (owner: ${nft.owner || 'none'})`)
      })
    }

    if (nftData.length > 0) {
      console.log('\\n✅ GALLERY SHOULD LOAD SUCCESSFULLY!')
      console.log('The gallery should now display', nftData.length, 'NFTs with proper metadata.')
    } else {
      console.log('\\n❌ GALLERY WILL BE EMPTY')
      console.log('No NFTs were successfully processed.')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testGalleryFlow()
