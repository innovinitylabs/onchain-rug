/**
 * Base62 encoding utilities for deterministic referral codes
 * Matches smart contract implementation for consistent code generation
 */

import { keccak256 } from 'viem'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Encode a bigint to base62 string
 * @param value The number to encode
 * @param length Desired output length (pads with leading zeros)
 * @returns Base62 encoded string
 */
export function encodeBase62(value: bigint, length: number): string {
  if (value === BigInt(0)) {
    return '0'.repeat(length);
  }

  let result = '';
  while (value > BigInt(0) && result.length < length) {
    const remainder = Number(value % BigInt(62));
    result = ALPHABET[remainder] + result;
    value = value / BigInt(62);
  }

  // Pad with leading zeros if needed
  while (result.length < length) {
    result = '0' + result;
  }

  return result.slice(-length); // Ensure exact length
}

/**
 * Generate deterministic referral code from wallet address
 * Matches smart contract LibBase62.generateReferralCode() implementation
 *
 * @param walletAddress Ethereum wallet address (0x...)
 * @returns 8-character base62 string
 */
export function generateReferralCode(walletAddress: string): string {
  // Convert address to bytes (matches Solidity abi.encodePacked)
  const addressBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    addressBytes[i] = parseInt(walletAddress.slice(2 + i * 2, 4 + i * 2), 16);
  }

  // Hash the address bytes using keccak256 (matches Solidity)
  const hash = keccak256(addressBytes);

  // Take first 8 bytes (64 bits) as in smart contract
  const hashBigInt = BigInt('0x' + hash.slice(2, 18)); // Skip 0x prefix, take 16 hex chars = 8 bytes

  // Encode to base62 (8 characters)
  return encodeBase62(hashBigInt, 8);
}


/**
 * Validate if a string contains only valid base62 characters
 * @param str String to validate
 * @returns True if valid base62
 */
export function isValidBase62(str: string): boolean {
  for (const char of str) {
    if (!ALPHABET.includes(char)) {
      return false;
    }
  }
  return true;
}

/**
 * Get full referral code (no prefix)
 * @param walletAddress Ethereum address
 * @returns Referral code (XXXXXXXX)
 */
export function getReferralCodeForWallet(walletAddress: string): string {
  return generateReferralCode(walletAddress);
}

/**
 * Example usage:
 *
 * ```typescript
 * const code = generateReferralCode("0x1234567890abcdef1234567890abcdef12345678");
 * // Returns something like: "a8x2k9mP"
 *
 * const fullCode = getReferralCodeForWallet("0x123...");
 * // Returns: "a8x2k9mP"
 * ```
 */