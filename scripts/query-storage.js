#!/usr/bin/env node

/**
 * Simple Node.js script to query Scripty storage
 * Run with: node scripts/query-storage.js
 */

import { ethers } from 'ethers'

// ScriptyStorageV2 ABI (minimal)
const ScriptyStorageV2ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'data', type: 'bytes' }
    ],
    name: 'getContent',
    outputs: [{ name: 'content', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'name', type: 'string' }],
    name: 'getContentChunkPointers',
    outputs: [{ name: 'pointers', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  }
]

const SCRIPTY_STORAGE_ADDRESS = '0x2263cf7764c19070b6fCE6E8B707f2bDc35222C9'

async function queryFile(fileName) {
  console.log(`\n=== Querying: ${fileName} ===`)

  try {
    // Connect to Shape Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.shape.network')
    const contract = new ethers.Contract(SCRIPTY_STORAGE_ADDRESS, ScriptyStorageV2ABI, provider)

    // Get content
    const contentBytes = await contract.getContent(fileName, '0x')

    if (!contentBytes || contentBytes.length === 0) {
      console.log('❌ File not found or empty')
      return
    }

    // Get chunk pointers
    const chunkPointers = await contract.getContentChunkPointers(fileName)

    console.log(`✅ Size: ${contentBytes.length} bytes`)
    console.log(`📦 Chunks: ${chunkPointers.length}`)
    console.log(`🔗 First chunk: ${chunkPointers[0]}`)
    console.log(`📄 Preview: ${ethers.toUtf8String(contentBytes).substring(0, 100)}...`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function main() {
  console.log('🔍 Querying Scripty Storage on Shape Sepolia...')

  // Query your uploaded libraries
  await queryFile('onchainrugs-p5.js.b64')
  await queryFile('onchainrugs.js.b64')

  // You can query any file by name
  // await queryFile('your-custom-file-name')
}

main().catch(console.error)
