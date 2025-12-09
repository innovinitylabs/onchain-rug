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
  title: "Onchain Rugs - Generative NFT Art on the Blockchain",
  description: "Create unique, woven onchain rugs NFTs with 102 color palettes, custom text embedding, and authentic cloth physics. Max supply: 10000 rugs.",
  icons: {
    icon: '/valipokkann.svg',
    shortcut: '/valipokkann.svg',
    apple: '/valipokkann.svg',
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
        <script
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
