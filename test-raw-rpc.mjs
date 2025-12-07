import { callContractMultiFallback, onchainRugsABI } from './lib/web3.ts'
import { getContractAddress } from './lib/networks.ts'

async function testRawRPC() {
  console.log('🔍 Testing Raw RPC Calls...\n')

  const chainId = 84532 // Base Sepolia
  const contractAddress = getContractAddress(chainId)
  const tokenId = 1

  console.log(`📍 Contract: ${contractAddress}`)
  console.log(`📍 Chain ID: ${chainId}`)
  console.log(`📍 Token ID: ${tokenId}\n`)

  try {
    // Test totalSupply
    console.log('🔢 Testing totalSupply()...')
    const totalSupply = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'totalSupply',
      [],
      { chainId }
    )
    console.log('✅ totalSupply result:', totalSupply)
    console.log('✅ Type:', typeof totalSupply)
    console.log()

    // Test ownerOf
    console.log('👤 Testing ownerOf(tokenId)...')
    const owner = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'ownerOf',
      [BigInt(tokenId)],
      { chainId }
    )
    console.log('✅ ownerOf result:', owner)
    console.log('✅ Type:', typeof owner)
    console.log()

    // Test tokenURI
    console.log('📄 Testing tokenURI(tokenId)...')
    const tokenURI = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'tokenURI',
      [BigInt(tokenId)],
      { chainId }
    )
    console.log('✅ tokenURI result:', tokenURI?.substring(0, 100) + '...')
    console.log('✅ Type:', typeof tokenURI)
    console.log()

    // Test getRugData
    console.log('🎨 Testing getRugData(tokenId)...')
    const rugData = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'getRugData',
      [BigInt(tokenId)],
      { chainId }
    )
    console.log('✅ getRugData result:')
    console.log(JSON.stringify(rugData, null, 2))
    console.log('✅ Type:', typeof rugData)
    console.log()

    // Test dynamic traits
    console.log('🧼 Testing getDirtLevel(tokenId)...')
    const dirtLevel = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'getDirtLevel',
      [BigInt(tokenId)],
      { chainId }
    )
    console.log('✅ getDirtLevel result:', dirtLevel)
    console.log('✅ Type:', typeof dirtLevel)
    console.log()

    console.log('⏳ Testing getAgingLevel(tokenId)...')
    const agingLevel = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'getAgingLevel',
      [BigInt(tokenId)],
      { chainId }
    )
    console.log('✅ getAgingLevel result:', agingLevel)
    console.log('✅ Type:', typeof agingLevel)
    console.log()

    console.log('🎨 Testing getFrameLevel(tokenId)...')
    const frameLevel = await callContractMultiFallback(
      contractAddress,
      onchainRugsABI,
      'getFrameLevel',
      [BigInt(tokenId)],
      { chainId }
    )
    console.log('✅ getFrameLevel result:', frameLevel)
    console.log('✅ Type:', typeof frameLevel)
    console.log()

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testRawRPC()
