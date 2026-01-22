import { getAllAttributionCodes } from '../erc8021-utils'
import { getReferralCodeForWallet } from '../base62'

describe('ERC-8021 Utils', () => {
  test('builds attribution codes with wallet', () => {
    const wallet = '0x1234567890abcdef1234567890abcdef12345678'

    const codes = getAllAttributionCodes({
      walletAddress: wallet,
      aggregatorCode: 'blur'
    })

    expect(codes.length).toBe(3)
    expect(codes[0]).toBe('onchainrugs') // builder code
    expect(codes[1]).toBe('blur') // aggregator code
    expect(codes[2]).toBe(getReferralCodeForWallet(wallet)) // deterministic attribution code
  })

  test('prioritizes codes correctly', () => {
    const wallet = '0x1234567890abcdef1234567890abcdef12345678'

    // Test priority: override > URL > stored > deterministic
    const codes = getAllAttributionCodes({
      overrideReferralCode: 'override123',
      walletAddress: wallet
    })

    expect(codes[2]).toBe('override123') // Override takes priority
  })

  test('handles missing wallet gracefully', () => {
    const codes = getAllAttributionCodes({
      aggregatorCode: 'opensea'
    })

    expect(codes.length).toBe(2) // No referral code without wallet
    expect(codes[0]).toBe('onchainrugs')
    expect(codes[1]).toBe('opensea')
  })

  test('integrates with base62 generation', () => {
    const wallet = '0x1234567890abcdef1234567890abcdef12345678'

    const codes = getAllAttributionCodes({ walletAddress: wallet })
    const referralCode = codes[2]

    // Should match direct generation
    const directCode = getReferralCodeForWallet(wallet)
    expect(referralCode).toBe(directCode)
  })
})