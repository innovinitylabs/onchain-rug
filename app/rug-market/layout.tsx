import { Metadata } from 'next'

/**
 * Server-side metadata generation for rug market page
 * 
 * Note: Dynamic metadata for individual rugs is handled client-side
 * via Head component in page.tsx because Next.js App Router doesn't
 * support dynamic searchParams in generateMetadata for client components.
 * 
 * This layout provides default metadata for the rug market page.
 */
export const metadata: Metadata = {
  title: 'Rug Market | Onchain Rugs',
  description: 'Browse and trade living generative NFT rugs that age over time and require your care.',
  openGraph: {
    title: 'Rug Market - Buy & Sell Living Onchain Generative NFT Rugs',
    description: 'Browse, buy, and sell living onchain generative NFT rugs that require your care.',
    url: 'https://www.onchainrugs.xyz/rug-market',
    type: 'website',
    images: [
      {
        url: 'https://www.onchainrugs.xyz/market-og.png',
        width: 1200,
        height: 630,
        alt: 'Rug Market - Onchain Rugs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rug Market - Buy & Sell Living Onchain Generative NFT Rugs',
    description: 'Browse, buy, and sell living onchain generative NFT rugs.',
    images: ['https://www.onchainrugs.xyz/market-og.png'],
  },
}

export default function RugMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

