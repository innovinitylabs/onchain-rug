import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  description: "Create unique, woven onchain rugs NFTs with 102 color palettes, custom text embedding, and authentic cloth physics. Max supply: 1111 rugs.",
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
