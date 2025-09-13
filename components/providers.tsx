'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { config as appConfig } from '@/lib/config'
import { wagmiConfig, shapeSepolia, shapeMainnet } from '@/lib/web3'

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient()

// RainbowKit configuration
const rainbowKitConfig = getDefaultConfig({
  appName: 'Onchain Rugs',
  projectId: appConfig.walletConnectProjectId,
  chains: [shapeSepolia, shapeMainnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider {...rainbowKitConfig}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
