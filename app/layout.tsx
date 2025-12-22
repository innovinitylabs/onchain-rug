import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import BackgroundRotator from "@/components/BackgroundRotator";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Import BigInt polyfill early - must be before React loads
import '@/lib/bigint-polyfill';

// Handle Chrome extension errors gracefully
if (typeof window !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Ignore Chrome extension errors
    if (typeof message === 'string' && (
      message.includes('chrome.runtime.sendMessage') ||
      message.includes('Extension ID') ||
      message.includes('chrome-extension://')
    )) {
      return true; // Suppress the error
    }
    // Call original error handler if it exists
    if (originalError) {
      return originalError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Also handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && typeof reason === 'object' && reason.message) {
      const message = reason.message;
      if (
        message.includes('chrome.runtime.sendMessage') ||
        message.includes('Extension ID') ||
        message.includes('chrome-extension://')
      ) {
        event.preventDefault(); // Suppress the error
      }
    }
  });
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onchain Rugs - Fully Onchain Living Generative NFT Art | Shape L2 Blockchain",
  description: "Experience fully onchain living generative NFT art. Each OnchainRug is a living NFT - completely onchain, generative, and dynamic. They age with dirt accumulation, require your care and maintenance, and evolve over time. 102 color palettes, custom text, authentic physics. Max supply: 10,000 unique living onchain artworks.",
  keywords: [
    "living NFT", "living onchain NFT", "fully onchain NFT", "onchain generative art", "living generative NFT",
    "Shape L2 NFT", "onchain textile art", "onchain woven art", "onchain digital rugs", "onchain aging NFT",
    "living NFT art", "blockchain generative art", "onchain NFT marketplace", "fully onchain collectibles",
    "onchain crypto art", "onchain blockchain art", "onchain NFT", "living digital art", "dynamic NFT"
  ],
  authors: [{ name: "OnchainRugs Team" }],
  creator: "valipokkann",
  publisher: "OnchainRugs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://onchainrugs.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Onchain Rugs - Fully Onchain Living Generative NFT Art",
    description: "Experience fully onchain living generative NFT art. Each OnchainRug is a living NFT - completely onchain, generative, and dynamic. They age with dirt accumulation, require your care and maintenance, and evolve over time. 102 color palettes, custom text, authentic physics.",
    url: 'https://onchainrugs.xyz',
    siteName: 'OnchainRugs',
    images: [
      {
        url: '/OnchainRugs.png',
        width: 1200,
        height: 630,
        alt: 'Onchain Rugs - Living Generative NFT Art',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Onchain Rugs - Fully Onchain Living Generative NFT Art",
    description: "Experience fully onchain living generative NFT art. Each OnchainRug is a living NFT that ages, requires your care, and evolves over time.",
    images: ['/OnchainRugs.png'],
    creator: '@valipokkann',
    site: '@valipokkann',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/valipokkann.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/valipokkann.svg',
    apple: '/valipokkann.svg',
  },
  manifest: '/manifest.json',
  category: 'NFT Art',
  other: {
    'base:app_id': '693f5725d19763ca26ddc2ea',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/valipokkann.svg" />
        <link rel="alternate icon" href="/valipokkann.svg" />
        <link rel="canonical" href="https://onchainrugs.xyz" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />

        {/* BigInt serialization polyfill */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              // BigInt serialization polyfill - must run before React loads
              (function() {
                if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
                  BigInt.prototype.toJSON = function() { return this.toString(); };
                }
                const originalStringify = JSON.stringify;
                JSON.stringify = function(value, replacer, space) {
                  if (typeof replacer === 'function') {
                    const wrapped = (key, val) => {
                      if (typeof val === 'bigint') return val.toString();
                      return replacer(key, val);
                    };
                    return originalStringify(value, wrapped, space);
                  }
                  const defaultReplacer = (key, val) => {
                    if (typeof val === 'bigint') return val.toString();
                    return val;
                  };
                  return originalStringify(value, defaultReplacer, space);
                };
              })();
            `,
          }}
        />

        {/* Client-side only JSON-LD scripts to prevent hydration mismatches */}
        {typeof window !== 'undefined' && (
          <>
            {/* JSON-LD Structured Data for Organization */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "name": "OnchainRugs",
                  "url": "https://onchainrugs.xyz",
                  "logo": "https://onchainrugs.xyz/valipokkann.svg",
                  "description": "Living generative NFT art collection featuring woven textile patterns that age over time on the Shape L2 blockchain.",
                  "founder": {
                    "@type": "Person",
                    "name": "valipokkann",
                    "url": "https://twitter.com/valipokkann"
                  },
                  "sameAs": [
                    "https://twitter.com/valipokkann",
                    "https://github.com/innovinitylabs/onchain-rugs"
                  ],
                  "knowsAbout": [
                    "NFT Art",
                    "Generative Art",
                    "Blockchain Technology",
                    "Shape L2 Network",
                    "Ethereum NFTs",
                    "Digital Collectibles"
                  ]
                })
              }}
            />

            {/* JSON-LD Structured Data for NFT Collection */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "CreativeWorkSeries",
                  "name": "Onchain Rugs",
                  "description": "A collection of living generative NFT artworks featuring woven textile patterns that evolve and age over time, requiring care and maintenance from their owners.",
                  "url": "https://onchainrugs.xyz",
                  "genre": ["Digital Art", "Generative Art", "NFT", "Blockchain Art"],
                  "creator": {
                    "@type": "Person",
                    "name": "valipokkann"
                  },
                  "dateCreated": "2024",
                  "artMedium": "Digital (HTML5 Canvas, P5.js)",
                  "artform": "Generative Textile Art",
                  "material": "On-chain generated, Shape L2 blockchain",
                  "numberOfItems": "10000",
                  "additionalProperty": [
                    {
                      "@type": "PropertyValue",
                      "name": "Blockchain",
                      "value": "Shape L2"
                    },
                    {
                      "@type": "PropertyValue",
                      "name": "Standard",
                      "value": "ERC-721"
                    },
                    {
                      "@type": "PropertyValue",
                      "name": "Unique Features",
                      "value": "Aging mechanics, maintenance system, generative art"
                    }
                  ],
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "ETH",
                    "availability": "https://schema.org/InStock",
                    "seller": {
                      "@type": "Organization",
                      "name": "OnchainRugs"
                    }
                  }
                })
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BackgroundRotator />
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
