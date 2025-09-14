// Simulate the gallery loading logic
console.log('🎯 TESTING GALLERY LOADING LOGIC')
console.log('=' .repeat(60))

// Simulate initial state
let loading = true
let initialLoad = true
let loadingAlchemy = true
let nfts = []
let alchemyData = null
let alchemyError = null

function simulateRenderDecision() {
  const shouldShowLoading = loading || loadingAlchemy || initialLoad
  console.log('🎯 Render decision:', {
    shouldShowLoading,
    loading,
    loadingAlchemy,
    initialLoad,
    nftsLength: nfts.length,
    hasAlchemyData: !!alchemyData,
    hasAlchemyError: !!alchemyError
  })
  return shouldShowLoading
}

function simulateProcessingUseEffect() {
  console.log('\\n🔄 Processing useEffect triggered:', {
    hasAlchemyData: !!alchemyData,
    hasAlchemyError: !!alchemyError,
    loadingAlchemy,
    loading,
    initialLoad,
    nftsLength: nfts.length
  })

  if (!alchemyData || alchemyError) {
    console.log('⏸️ Skipping processing - no data or error:', {
      alchemyData: !!alchemyData,
      alchemyError: alchemyError?.message
    })
    return
  }

  console.log('✅ Processing data...')
  // Simulate successful processing
  nfts = [{ tokenId: 1 }, { tokenId: 2 }] // Mock data

  console.log('✅ Final NFT data array:', nfts)
  console.log('📊 Total NFTs processed:', nfts.length)

  // Set loading to false once we have data
  if (nfts.length > 0 || !loadingAlchemy) {
    loading = false
    initialLoad = false
    console.log('✅ Set loading states to false')
  }
}

// Test initial render
console.log('📊 INITIAL STATE:')
simulateRenderDecision()

// Simulate API call completing
console.log('\\n🔄 SIMULATING API CALL COMPLETION:')
loadingAlchemy = false
alchemyData = { nfts: [{ tokenId: 1 }, { tokenId: 2 }] } // Mock data

// Simulate processing
simulateProcessingUseEffect()

// Test render after processing
console.log('\\n📊 AFTER PROCESSING:')
simulateRenderDecision()

console.log('\\n🎉 Test completed!')
