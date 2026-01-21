import { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { AttributionDashboard } from '@/components/attribution'

export const metadata: Metadata = {
  title: "Referral Program - Earn 5% Commission | OnchainRugs",
  description: "Join the OnchainRugs referral program and earn 5% commission on every NFT mint and marketplace purchase. Share your unique referral link and start earning passive income from the growing OnchainRugs community.",
  keywords: [
    "NFT referral program", "earn commission NFTs", "referral rewards", "passive income NFTs",
    "OnchainRugs referrals", "NFT affiliate program", "earn from NFT sales", "referral commissions"
  ],
  openGraph: {
    title: "Referral Program - Earn 5% Commission | OnchainRugs",
    description: "Earn 5% commission on every NFT mint and marketplace purchase through our referral program. Share your unique link and start earning today.",
    url: 'https://onchainrugs.xyz/referrals',
    siteName: 'OnchainRugs',
    images: [
      {
        url: '/OnchainRugs.png',
        width: 1200,
        height: 630,
        alt: 'OnchainRugs Referral Program',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Referral Program - Earn 5% Commission | OnchainRugs",
    description: "Earn 5% commission on every NFT mint and marketplace purchase through our referral program.",
    images: ['/OnchainRugs.png'],
  },
}

export default function ReferralsPage() {
  return (
    <div className="page-wrapper">
      <Navigation />
      <main className="page-main">
        <div className="container mx-auto px-4 py-8">
          <AttributionDashboard />
        </div>
      </main>
      <div className="page-footer">
        <Footer />
      </div>
    </div>
  )
}