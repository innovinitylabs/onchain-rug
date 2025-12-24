/**
 * Utility to capture NFT display as an image for sharing
 * Since NFTs are HTML-generated, we need to capture the rendered canvas
 */

export async function captureNFTImage(element: HTMLElement): Promise<string | null> {
  try {
    // Check if html2canvas is available (we'll add it as a dependency)
    // For now, we'll use a simpler approach: find the canvas element and convert it
    const canvas = element.querySelector('canvas') as HTMLCanvasElement
    
    if (canvas) {
      // Convert canvas to data URL
      return canvas.toDataURL('image/png')
    }
    
    // If no canvas found, try to find iframe with animation_url
    const iframe = element.querySelector('iframe') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        // Try to access iframe content (may fail due to CORS)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        const iframeCanvas = iframeDoc.querySelector('canvas') as HTMLCanvasElement
        
        if (iframeCanvas) {
          return iframeCanvas.toDataURL('image/png')
        }
      } catch (error) {
        // CORS or other error accessing iframe content
        console.warn('Cannot access iframe content for image capture:', error)
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to capture NFT image:', error)
    return null
  }
}

/**
 * Alternative: Generate image URL from NFT data
 * This creates a data URL from the NFT's rendered state
 */
export async function generateNFTImageUrl(
  tokenId: number,
  animationUrl?: string
): Promise<string | null> {
  if (!animationUrl) {
    return null
  }
  
  // For now, return the animation_url
  // In the future, we could create an API endpoint that renders the HTML and converts to image
  return animationUrl
}

