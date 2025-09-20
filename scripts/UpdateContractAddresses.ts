/**
 * Script to update OnchainRugs contract addresses
 * Run with: npx hardhat run scripts/UpdateContractAddresses.ts --network shapeSepolia
 */

import { ethers } from 'hardhat'

async function main() {
  console.log('🔧 Updating OnchainRugs Contract Addresses...')

  // Contract addresses
  const onchainRugsAddress = '0x73db032918FAEb5c853045cF8e9F70362738a8ee'
  const scriptyBuilderAddress = '0x8548f9f9837E055dCa729DC2f6067CC9aC6A0EA8'
  const correctStorageAddress = '0x8523D1ED6e4a2AC12d25A22F829Ffa50c205D58e'
  const htmlGeneratorAddress = '0x0aB9850E205807c615bA936eA27D020406D78131'

  // Get signer
  const [signer] = await ethers.getSigners()
  console.log('Using signer:', await signer.getAddress())

  // Get contract instance
  const OnchainRugs = await ethers.getContractFactory('OnchainRugs')
  const onchainRugs = OnchainRugs.attach(onchainRugsAddress)

  // Check current addresses
  console.log('\n📋 Current Configuration:')
  console.log('ScriptyBuilder:', await onchainRugs.rugScriptyBuilder())
  console.log('Storage:', await onchainRugs.rugEthFSStorage())
  console.log('HTML Generator:', await onchainRugs.onchainRugsHTMLGenerator())

  // Update addresses
  console.log('\n🔄 Updating to correct addresses...')
  const tx = await onchainRugs.setRugScriptyContracts(
    scriptyBuilderAddress,
    correctStorageAddress, // This is the key fix
    htmlGeneratorAddress
  )

  console.log('Transaction hash:', tx.hash)
  await tx.wait()
  console.log('✅ Transaction confirmed!')

  // Verify new addresses
  console.log('\n📋 New Configuration:')
  console.log('ScriptyBuilder:', await onchainRugs.rugScriptyBuilder())
  console.log('Storage:', await onchainRugs.rugEthFSStorage())
  console.log('HTML Generator:', await onchainRugs.onchainRugsHTMLGenerator())

  console.log('\n🎉 Contract addresses updated successfully!')
  console.log('TokenURI generation should now work correctly.')
}

main().catch(console.error)
