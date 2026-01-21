import { generateReferralCode, encodeBase62, isValidBase62, getReferralCodeForWallet } from '../base62'

describe('Base62 Encoding', () => {
  test('encodes bigint to base62', () => {
    expect(encodeBase62(0n, 8)).toBe('00000000')
    expect(encodeBase62(1n, 8)).toBe('00000001')
    expect(encodeBase62(62n, 8)).toBe('00000010')
  })

  test('validates base62 strings', () => {
    expect(isValidBase62('ABCDEFGH')).toBe(true)
    expect(isValidBase62('abcdefgh')).toBe(true)
    expect(isValidBase62('01234567')).toBe(true)
    expect(isValidBase62('ABCDEFGH!')).toBe(false) // Invalid character
  })

  test('generates deterministic codes', () => {
    const wallet1 = '0x1234567890abcdef1234567890abcdef12345678'
    const wallet2 = '0x9876543210fedcba9876543210fedcba98765432'

    const code1a = generateReferralCode(wallet1)
    const code1b = generateReferralCode(wallet1)
    const code2 = generateReferralCode(wallet2)

    expect(code1a).toBe(code1b) // Same wallet, same code
    expect(code1a).not.toBe(code2) // Different wallets, different codes
    expect(code1a.length).toBe(8) // 8 characters
    expect(isValidBase62(code1a)).toBe(true)
  })

  test('generates full referral codes', () => {
    const wallet = '0x1234567890abcdef1234567890abcdef12345678'
    const fullCode = getReferralCodeForWallet(wallet)

    expect(fullCode.startsWith('ref-')).toBe(true)
    expect(fullCode.length).toBe(12) // 'ref-' + 8 chars
    expect(isValidBase62(fullCode.slice(4))).toBe(true)
  })

  test('handles edge cases', () => {
    // Zero address
    const zeroCode = generateReferralCode('0x0000000000000000000000000000000000000000')
    expect(zeroCode.length).toBe(8)
    expect(isValidBase62(zeroCode)).toBe(true)

    // Max address
    const maxCode = generateReferralCode('0xffffffffffffffffffffffffffffffffffffffff')
    expect(maxCode.length).toBe(8)
    expect(isValidBase62(maxCode)).toBe(true)
  })
})