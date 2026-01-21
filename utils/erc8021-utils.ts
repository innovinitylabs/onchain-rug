/**
 * ERC-8021 Attribution Utilities
 * 
 * Builds ERC-8021 data suffixes for transaction attribution
 * Supports multiple attribution codes: builder codes, aggregator codes, referral codes
 */

import { concat, bytesToHex } from 'viem'
import { generateAttributionCode, getAttributionCodeForWallet, isValidBase62 } from './base62'

/**
 * ERC-8021 Marker (16 bytes)
 */
const ERC8021_MARKER = '0x80218021802180218021802180218021' as const

/**
 * Schema 0 (Canonical) ID
 */
const SCHEMA_0_CANONICAL = 0

/**
 * Builds ERC-8021 suffix for transaction attribution
 * 
 * @param codes Array of attribution codes (e.g., ["onchainrugs", "blur", "ref-alice123"])
 * @returns Hex string representing the ERC-8021 suffix
 * 
 * Format: [codesLength (1 byte)] + [codes (ASCII, comma-delimited)] + [Schema ID (0)] + [Marker (16 bytes)]
 * 
 * Example:
 * - Input: ["onchainrugs", "blur"]
 * - Output: Suffix bytes ready to append to transaction calldata
 */
export function buildERC8021Suffix(codes: string[]): `0x${string}` {
  if (codes.length === 0) {
    throw new Error('At least one attribution code is required')
  }

  // Join codes with comma delimiter
  const codesString = codes.join(',')
  
  // Convert to bytes using TextEncoder (browser/Node.js compatible)
  const encoder = new TextEncoder()
  const codesBytes = encoder.encode(codesString)
  
  // Validate codes length (1 byte max = 255 bytes)
  if (codesBytes.length > 255) {
    throw new Error('Total codes length exceeds 255 bytes')
  }

  // Build suffix structure:
  // [codesLength (1 byte)] + [codes (bytes)] + [Schema ID (0)] + [Marker (16 bytes)]
  
  const codesLength = codesBytes.length
  
  // Convert marker hex string to bytes (remove 0x prefix, convert pairs to bytes)
  const markerHex = ERC8021_MARKER.slice(2) // Remove '0x'
  const markerBytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    markerBytes[i] = parseInt(markerHex.slice(i * 2, i * 2 + 2), 16)
  }
  
  // Build suffix manually: [codesLength] + [codes] + [schemaId] + [marker]
  const suffixArray: Uint8Array[] = [
    new Uint8Array([codesLength]),
    codesBytes,
    new Uint8Array([SCHEMA_0_CANONICAL]),
    markerBytes
  ]
  
  // Concatenate all parts
  const totalLength = suffixArray.reduce((sum, arr) => sum + arr.length, 0)
  const suffix = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of suffixArray) {
    suffix.set(arr, offset)
    offset += arr.length
  }
  
  return bytesToHex(suffix) as `0x${string}`
}

/**
 * Builds attribution codes array for a transaction
 * 
 * @param options Configuration for attribution codes
 * @returns Array of attribution codes
 */
export function buildAttributionCodes(options: {
  builderCode?: string  // Our builder code (e.g., "onchainrugs") for Base rewards
  aggregatorCode?: string  // Aggregator code (e.g., "blur", "opensea")
  referralCode?: string  // Referral code (e.g., "ref-alice123")
  customCodes?: string[]  // Additional custom codes
}): string[] {
  const codes: string[] = []
  
  // Add builder code first (for Base platform rewards)
  if (options.builderCode) {
    codes.push(options.builderCode)
  }
  
  // Add aggregator code (for analytics)
  if (options.aggregatorCode) {
    codes.push(options.aggregatorCode)
  }
  
  // Add referral code (for referral rewards)
  if (options.referralCode) {
    codes.push(options.referralCode)
  }
  
  // Add custom codes
  if (options.customCodes && options.customCodes.length > 0) {
    codes.push(...options.customCodes)
  }
  
  return codes
}

/**
 * Appends ERC-8021 suffix to encoded function calldata
 * 
 * @param encodedCalldata Original function call encoded data
 * @param codes Attribution codes to append
 * @returns Calldata with ERC-8021 suffix appended
 */
export function appendERC8021Suffix(
  encodedCalldata: `0x${string}`,
  codes: string[]
): `0x${string}` {
  if (codes.length === 0) {
    return encodedCalldata
  }
  
  const suffix = buildERC8021Suffix(codes)
  return concat([encodedCalldata, suffix]) as `0x${string}`
}

/**
 * Gets our default builder code for Base platform rewards
 * Can be configured via environment variable
 */
export function getDefaultBuilderCode(): string {
  return process.env.NEXT_PUBLIC_ERC8021_BUILDER_CODE || 'onchainrugs'
}

/**
 * Extracts ERC-8021 attribution code from URL parameters
 * Looks for 'ref' query parameter
 */
export function getAttributionCodeFromURL(): string | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const refCode = params.get('ref')

  if (refCode && isValidBase62(refCode)) {
    return refCode
  }

  return null
}

/**
 * Gets ERC-8021 attribution code from localStorage (if user has one saved)
 */
export function getStoredAttributionCode(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem('attribution_code')
  } catch {
    return null
  }
}

/**
 * Saves ERC-8021 attribution code to localStorage
 */
export function saveAttributionCode(code: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('attribution_code', code)
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Gets all attribution codes for a transaction
 * Combines builder code, URL referral code, stored referral code, and aggregator codes
 */
export function getAllAttributionCodes(options?: {
  aggregatorCode?: string
  overrideAttributionCode?: string
  walletAddress?: string // For deterministic attribution codes
}): string[] {
  const codes: string[] = []

  // 1. Add builder code (for Base rewards)
  codes.push(getDefaultBuilderCode())

  // 2. Add aggregator code if provided
  if (options?.aggregatorCode) {
    codes.push(options.aggregatorCode)
  }

  // 3. Add attribution code (priority: override > URL > stored > deterministic)
  let attributionCode =
    options?.overrideAttributionCode ||
    getAttributionCodeFromURL() ||
    getStoredAttributionCode()

  // If no stored/URL code and wallet provided, use deterministic code
  if (!attributionCode && options?.walletAddress) {
    attributionCode = getAttributionCodeForWallet(options.walletAddress)
  }

  if (attributionCode) {
    codes.push(attributionCode)
  }

  return codes
}

/**
 * Example usage:
 * 
 * ```typescript
 * // Simple usage with default builder code
 * const codes = getAllAttributionCodes()
 * const suffix = buildERC8021Suffix(codes)
 * 
 * // With aggregator
 * const codes = getAllAttributionCodes({ aggregatorCode: 'blur' })
 * const suffix = buildERC8021Suffix(codes)
 * 
 * // Manual code building
 * const codes = buildAttributionCodes({
 *   builderCode: 'onchainrugs',
 *   aggregatorCode: 'blur',
 *   referralCode: 'ref-alice123'
 * })
 * const suffix = buildERC8021Suffix(codes)
 * ```
 */

