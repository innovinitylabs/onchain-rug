"use client"

import { useEffect } from 'react'
import { isValidBase62 } from '@/utils/base62'

/**
 * Client-side component that handles referral URL parameter extraction
 * Runs on every page load to extract and store referral codes from URLs
 */
export default function ReferralUrlHandler() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const refParam = urlParams.get('ref') || urlParams.get('r') // Support both 'ref' and 'r'

      if (refParam) {
        // Validate the referral code format
        const cleanCode = refParam.trim()

        // Check if it's a valid referral code (either starts with 'ref-' or is valid base62)
        let referralCode = ''

        if (isValidBase62(cleanCode)) {
          // All codes are now just the base62 string
          referralCode = cleanCode
        } else {
          // Invalid format, skip
          return
        }

        // Store in localStorage for future use
        localStorage.setItem('referral_code', referralCode)

        console.log('Referral code extracted and stored:', referralCode)

        // Optional: Clean URL by removing the parameter (but keep for now to avoid breaking sharing)
        // This would require more complex URL manipulation and could break bookmarking
      }
    } catch (error) {
      console.warn('Error processing referral URL parameters:', error)
    }
  }, []) // Empty dependency array - only run once on mount

  // This component doesn't render anything
  return null
}