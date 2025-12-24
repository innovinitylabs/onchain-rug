/**
 * Server Component Wrapper for Rug Market Page
 * 
 * This file exports generateMetadata which runs on the SERVER before HTML is sent.
 * This ensures Twitter/X crawlers see the correct OG meta tags.
 * 
 * WHY CLIENT-SIDE OG TAGS DON'T WORK:
 * - Twitter/X crawlers don't execute JavaScript
 * - Twitter/X crawlers don't wait for React hydration
 * - Client-side <Head> tags are rendered AFTER initial HTML
 * - Crawlers only see the initial server-rendered HTML
 * 
 * WHY generateMetadata IS MANDATORY:
 * - Runs on the server before HTML is sent
 * - Included in initial HTML response
 * - Visible to all crawlers (Twitter, Facebook, etc.)
 * - Works with Next.js App Router conventions
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import Navigation from '../../components/Navigation'
import Footer from '../../components/Footer'
import LoadingAnimation from '../../components/LoadingAnimation'
import RugMarketPageContent from './page-content'

interface GenerateMetadataProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Server-side metadata generation
 * 
 * This function runs on the SERVER and generates OG meta tags
 * based on searchParams (tokenId, chainId) BEFORE the HTML is sent.
 * Twitter/X crawlers will see these tags in the initial HTML.
 */
export async function generateMetadata({ searchParams }: GenerateMetadataProps): Promise<Metadata> {
  // Await searchParams (Next.js 15+ makes this a Promise)
  const params = await searchParams
  const tokenIdParam = params.tokenId
  const chainIdParam = params.chainId
  
  // Parse tokenId
  const tokenId = typeof tokenIdParam === 'string' ? parseInt(tokenIdParam) : null
  const chainId = typeof chainIdParam === 'string' ? parseInt(chainIdParam) : 84532
  
  // Base URL - NEVER use localhost
  const baseUrl = 'https://www.onchainrugs.xyz'
  
  // If tokenId is present, generate NFT-specific metadata
  if (tokenId && !isNaN(tokenId) && tokenId > 0) {
    const ogImageUrl = `${baseUrl}/api/og/rug?tokenId=${tokenId}${chainId !== 84532 ? `&chainId=${chainId}` : ''}`
    const pageUrl = `${baseUrl}/rug-market?tokenId=${tokenId}${chainId !== 84532 ? `&chainId=${chainId}` : ''}`
    
    return {
      title: `OnchainRug #${tokenId} | Onchain Rugs`,
      description: `View OnchainRug #${tokenId} - A living generative NFT that ages over time and requires your care.`,
      openGraph: {
        title: `OnchainRug #${tokenId}`,
        description: `View OnchainRug #${tokenId} - A living generative NFT that ages over time and requires your care.`,
        url: pageUrl,
        type: 'website',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `OnchainRug #${tokenId}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `OnchainRug #${tokenId}`,
        description: `View OnchainRug #${tokenId} - A living generative NFT`,
        images: [ogImageUrl],
      },
      alternates: {
        canonical: pageUrl,
      },
    }
  }
  
  // Default collection-level metadata (no tokenId)
  return {
    title: 'Rug Market - Buy & Sell Living Onchain Rug NFTs | OnchainRugs',
    description: 'Browse, buy, and sell living onchain generative NFT rugs that require your care. Each rug is a living NFT - completely onchain, generative, and dynamic. They age, evolve, and require maintenance. Trade on Shape L2 blockchain.',
    keywords: [
      'NFT marketplace',
      'buy NFT',
      'sell NFT',
      'rug NFT marketplace',
      'generative NFT trading',
      'Shape L2 marketplace',
      'living NFT marketplace',
      'blockchain art marketplace',
      'NFT collection trading',
    ],
    openGraph: {
      title: 'Rug Market - Buy & Sell Living Onchain Generative NFT Rugs',
      description: 'Browse, buy, and sell living onchain generative NFT rugs that require your care. Each rug is a living NFT - completely onchain, generative, and dynamic. They age, evolve, and require maintenance.',
      url: `${baseUrl}/rug-market`,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/market-og.png`,
          width: 1200,
          height: 630,
          alt: 'Rug Market - Onchain Rugs',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Rug Market - Buy & Sell Living Onchain Generative NFT Rugs',
      description: 'Browse, buy, and sell living onchain generative NFT rugs that require your care. Each rug is a living NFT.',
      images: [`${baseUrl}/market-og.png`],
    },
    alternates: {
      canonical: `${baseUrl}/rug-market`,
    },
  }
}

/**
 * Server Component Page Wrapper
 * 
 * This component renders the client-side page content.
 * The generateMetadata export above ensures OG tags are in the initial HTML.
 */
export default function RugMarketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Navigation />
        <div className="flex items-center justify-center flex-grow">
          <LoadingAnimation />
        </div>
        <Footer />
      </div>
    }>
      <RugMarketPageContent />
    </Suspense>
  )
}
