/**
 * Layout for rug market page
 * 
 * NOTE: Metadata is now generated server-side in metadata.ts via generateMetadata.
 * This ensures Twitter/X crawlers see the correct OG tags because:
 * - generateMetadata runs on the server before HTML is sent
 * - OG tags are included in initial HTML response
 * - Crawlers don't execute JavaScript, so client-side tags are invisible
 * 
 * The layout no longer defines static metadata - all metadata is dynamic
 * based on searchParams (tokenId, chainId) and handled in metadata.ts
 */

export default function RugMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

