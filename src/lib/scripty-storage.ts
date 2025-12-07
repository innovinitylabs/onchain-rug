/**
 * Scripty Storage Query Utilities
 * Examples of how to query files from ScriptyStorageV2
 */

import { ethers } from 'ethers'

// ScriptyStorageV2 ABI
export const ScriptyStorageV2ABI = [
  // getContent function
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
  // getContentChunkPointers function
  {
    inputs: [{ name: 'name', type: 'string' }],
    name: 'getContentChunkPointers',
    outputs: [{ name: 'pointers', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  // contents mapping
  {
    inputs: [{ name: '', type: 'string' }],
    name: 'contents',
    outputs: [
      { name: 'isFrozen', type: 'bool' },
      { name: 'owner', type: 'address' },
      { name: 'size', type: 'uint256' },
      { name: 'details', type: 'bytes' },
      { name: 'chunks', type: 'address[]' }
    ],
    stateMutability: 'view',
    type: 'function',
  }
] as const

// Contract addresses
export const SCRIPTY_STORAGE_ADDRESS = '0x2263cf7764c19070b6fce6e8b707f2bdc35222c9'

/**
 * Query a file from Scripty storage
 */
export async function queryScriptyFile(
  provider: ethers.Provider,
  fileName: string
): Promise<{
  content: string
  size: number
  chunkPointers: string[]
} | null> {
  try {
    const contract = new ethers.Contract(
      SCRIPTY_STORAGE_ADDRESS,
      ScriptyStorageV2ABI,
      provider
    )

    // Get the full content
    const contentBytes = await contract.getContent(fileName, '0x')

    if (!contentBytes || contentBytes.length === 0) {
      console.log(`File ${fileName} not found or empty`)
      return null
    }

    // Get chunk pointers
    const chunkPointers = await contract.getContentChunkPointers(fileName)

    return {
      content: ethers.toUtf8String(contentBytes),
      size: contentBytes.length,
      chunkPointers: chunkPointers
    }
  } catch (error) {
    console.error(`Error querying file ${fileName}:`, error)
    return null
  }
}

/**
 * Query your uploaded libraries
 */
export async function queryLibraries(provider: ethers.Provider) {
  console.log('Querying Scripty libraries...')

  const libraries = ['onchainrugs-p5.js.b64', 'onchainrugs.js.b64']

  for (const libName of libraries) {
    const result = await queryScriptyFile(provider, libName)

    if (result) {
      console.log(`✅ ${libName}:`)
      console.log(`   Size: ${result.size} bytes`)
      console.log(`   Chunks: ${result.chunkPointers.length}`)
      console.log(`   Preview: ${result.content.substring(0, 100)}...`)
    } else {
      console.log(`❌ ${libName}: Not found`)
    }
  }
}

/**
 * Example usage with ethers.js
 */
export async function exampleUsage() {
  // Connect to Shape Sepolia
  const provider = new ethers.JsonRpcProvider('https://sepolia.shape.network')

  // Query specific file
  const p5Lib = await queryScriptyFile(provider, 'onchainrugs-p5.js.b64')
  if (p5Lib) {
    console.log('P5.js library loaded:', p5Lib.size, 'bytes')
  }

  // Query all libraries
  await queryLibraries(provider)
}

/**
 * React hook example (if using wagmi)
 */
export function useScriptyFile(fileName: string) {
  // This would be used in a React component with wagmi hooks
  return {
    data: null, // wagmi query result
    isLoading: false,
    error: null
  }
}
