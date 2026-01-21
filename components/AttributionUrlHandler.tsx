"use client"

import { useEffect } from 'react'
import { isValidBase62 } from '@/utils/base62'

/**
 * Client-side component that handles ERC-8021 attribution URL parameter extraction
 * Runs on every page load to extract and store attribution codes from URLs
 */
export default function AttributionUrlHandler() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const refParam = urlParams.get('ref') || urlParams.get('r') // Support both 'ref' and 'r'

      if (refParam) {
        // Validate the ERC-8021 attribution code format
        const cleanCode = refParam.trim()

        // Check if it's a valid base62 attribution code
        let attributionCode = ''

        if (isValidBase62(cleanCode)) {
          // All codes are now just the base62 string
          attributionCode = cleanCode
        } else {
          // Invalid format, skip
          return
        }

        // Store in localStorage for future use
        localStorage.setItem('attribution_code', attributionCode)

        console.log('ERC-8021 attribution code extracted and stored:', attributionCode)

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