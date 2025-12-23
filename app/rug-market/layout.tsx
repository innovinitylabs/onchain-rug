import { Metadata } from 'next'
import { headers } from 'next/headers'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const searchParams = headersList.get('x-search-params') || ''
  const url = new URL(`https://www.onchainrugs.xyz/rug-market${searchParams}`)
  const tokenId = url.searchParams.get('tokenId')

  if (tokenId) {
    const baseUrl = 'https://www.onchainrugs.xyz'
    const sharePageUrl = `${baseUrl}/rug-market?tokenId=${tokenId}`
    
    return {
      title: `OnchainRug #${tokenId} | Onchain Rugs`,
      description: `View OnchainRug #${tokenId} - A living generative NFT that ages over time and requires your care.`,
      openGraph: {
        title: `OnchainRug #${tokenId}`,
        description: `View OnchainRug #${tokenId} - A living generative NFT`,
        url: sharePageUrl,
        type: 'website',
        images: [
          {
            url: `${baseUrl}/api/rug-image/${tokenId}/og-image`,
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
        images: [`${baseUrl}/api/rug-image/${tokenId}/og-image`],
      },
    }
  }

  return {
    title: 'Rug Market | Onchain Rugs',
    description: 'Browse and trade living generative NFT rugs',
  }
}

export default function RugMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

