/**
 * Cache Migration API - Convert old Redis format to new TokenOperations format
 *
 * This endpoint migrates existing cached NFTs from the old Redis key format
 * (nft:static:chain:contract:tokenId) to the new TokenOperations format
 * (token:chain:contract:tokenId)
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis-schema'
import { TokenOperations } from '@/lib/redis-operations'
import { getContractAddress } from '@/lib/networks'

export async function POST(request: NextRequest) {
  try {
    const { chainId, contractAddress, migrateAll = false } = await request.json()

    console.log(`Cache Migration: Starting migration for chain ${chainId}, contract ${contractAddress}`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    if (migrateAll) {
      // Migrate all contracts and chains
      console.log('Cache Migration: Migrating all cached data...')

      // Get all old static keys
      const oldKeys = await redis.keys('nft:static:*:*:*')
      console.log(`Cache Migration: Found ${oldKeys.length} old cache entries to migrate`)

      for (const oldKey of oldKeys) {
        try {
          // Parse key format: nft:static:chainId:contractAddress:tokenId
          const parts = oldKey.split(':')
          if (parts.length !== 5) continue

          const [, , chainIdStr, contractAddr, tokenIdStr] = parts
          const tokenId = parseInt(tokenIdStr)

          const result = await migrateSingleToken(
            parseInt(chainIdStr),
            contractAddr as `0x${string}`,
            tokenId,
            oldKey
          )

          if (result.migrated) migratedCount++
          else if (result.skipped) skippedCount++
          else errorCount++

        } catch (error) {
          console.error(`Cache Migration: Error migrating ${oldKey}:`, error)
          errorCount++
        }
      }
    } else {
      // Migrate specific contract
      const contractAddr = contractAddress || getContractAddress(chainId)

      if (!contractAddr) {
        return NextResponse.json(
          { error: 'Contract address not found for chain' },
          { status: 400 }
        )
      }

      // Get total supply to know how many tokens to check
      // For now, we'll check a reasonable range (0-1000)
      const maxTokenId = 1000

      for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
        try {
          const oldKey = `nft:static:${chainId}:${contractAddr}:${tokenId}`
          const exists = await redis.exists(oldKey)

          if (exists) {
            const result = await migrateSingleToken(chainId, contractAddr, tokenId, oldKey)
            if (result.migrated) migratedCount++
            else if (result.skipped) skippedCount++
            else errorCount++
          }
        } catch (error) {
          console.error(`Cache Migration: Error migrating token ${tokenId}:`, error)
          errorCount++
        }
      }
    }

    console.log(`Cache Migration: Complete - ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
      message: `Migration completed: ${migratedCount} NFTs migrated to new cache format`
    })

  } catch (error) {
    console.error('Cache Migration: Fatal error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

async function migrateSingleToken(
  chainId: number,
  contractAddress: `0x${string}`,
  tokenId: number,
  oldKey: string
): Promise<{ migrated: boolean, skipped: boolean }> {
  try {
    // Check if already migrated (new format exists)
    const newTokenId = `token:${chainId}:${contractAddress}:${tokenId}`
    const existingToken = await TokenOperations.getToken(newTokenId)

    if (existingToken) {
      console.log(`Cache Migration: Token ${tokenId} already migrated, skipping`)
      return { migrated: false, skipped: true }
    }

    // Get old cached data
    const oldStaticData = await redis.get(oldKey)
    const oldDynamicKey = `nft:dynamic:${chainId}:${contractAddress}:${tokenId}`
    const oldTokenURIKey = `nft:tokenuri:${chainId}:${contractAddress}:${tokenId}`
    const oldHashKey = `nft:hash:${chainId}:${contractAddress}:${tokenId}`

    const [oldDynamicData, oldTokenURIData, oldHashData] = await Promise.all([
      redis.get(oldDynamicKey),
      redis.get(oldTokenURIKey),
      redis.get(oldHashKey)
    ])

    if (!oldStaticData) {
      console.log(`Cache Migration: No static data found for token ${tokenId}, skipping`)
      return { migrated: false, skipped: true }
    }

    // Parse old data format
    const staticData = JSON.parse(oldStaticData as string)
    const dynamicData = oldDynamicData ? JSON.parse(oldDynamicData as string) : {
      dirtLevel: 0,
      agingLevel: 0,
      lastMaintenance: new Date().toISOString(),
      maintenanceCount: 0,
      lastCleaning: new Date().toISOString(),
      cleaningCount: 0
    }

    // Create new token data in TokenOperations format
    const tokenData = {
      contractId: `${chainId}:${contractAddress}`,
      tokenId,
      owner: dynamicData.owner || staticData.owner || '0x0000000000000000000000000000000000000000',
      name: staticData.name || `NFT #${tokenId}`,
      description: staticData.description || '',
      image: staticData.image || '',
      animation_url: staticData.animation_url || '',
      traits: [], // Will be populated if available in static data
      dynamic: {
        dirtLevel: dynamicData.dirtLevel || 0,
        agingLevel: dynamicData.agingLevel || 0,
        lastMaintenance: dynamicData.lastMaintenance || new Date().toISOString(),
        maintenanceCount: dynamicData.maintenanceCount || 0,
        lastCleaning: dynamicData.lastCleaning || new Date().toISOString(),
        cleaningCount: dynamicData.cleaningCount || 0,
        lastRestoration: dynamicData.lastRestoration,
        restorationCount: dynamicData.restorationCount
      },
      metadataHash: oldHashData || '',
      lastRefresh: new Date().toISOString(),
      createdAt: staticData.createdAt || new Date().toISOString()
    }

    // Store in new format
    await TokenOperations.storeToken(tokenData)

    console.log(`Cache Migration: Successfully migrated token ${tokenId}`)
    return { migrated: true, skipped: false }

  } catch (error) {
    console.error(`Cache Migration: Failed to migrate token ${tokenId}:`, error)
    return { migrated: false, skipped: false }
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    const chainId = parseInt(request.nextUrl.searchParams.get('chainId') || '84532')
    const contractAddress = request.nextUrl.searchParams.get('contractAddress')

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'contractAddress parameter required' },
        { status: 400 }
      )
    }

    // Count old format entries
    const oldPattern = `nft:static:${chainId}:${contractAddress}:*`
    const oldKeys = await redis.keys(oldPattern)

    // Count new format entries
    const newPattern = `token:${chainId}:${contractAddress}:*`
    const newKeys = await redis.keys(newPattern)

    return NextResponse.json({
      chainId,
      contractAddress,
      oldFormatCount: oldKeys.length,
      newFormatCount: newKeys.length,
      migrationNeeded: oldKeys.length > 0 && newKeys.length < oldKeys.length,
      status: oldKeys.length === 0 ? 'no_old_data' :
              newKeys.length >= oldKeys.length ? 'fully_migrated' :
              'partial_migration'
    })

  } catch (error) {
    console.error('Migration status check error:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}
