'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { config as appConfig } from '@/lib/config'
import { wagmiConfig, shapeSepolia, shapeMainnet } from '@/lib/web3'
import { useMemo } from 'react'

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  // Create RainbowKit config inside the component to ensure env vars are available
  const rainbowKitConfig = useMemo(() => {
    const projectId = appConfig.walletConnectProjectId

    // Ensure we have a valid projectId
    if (!projectId || projectId === '') {
      console.warn('WalletConnect Project ID not found. Please set WALLET_CONNECT_PROJECT_ID environment variable.')
      // Use a fallback that won't break the app
      return getDefaultConfig({
        appName: 'Onchain Rugs',
        projectId: 'placeholder-project-id', // This will be overridden when env var is set
        chains: [shapeSepolia, shapeMainnet],
        ssr: true,
      })
    }

    return getDefaultConfig({
      appName: 'Onchain Rugs',
      projectId: projectId,
      chains: [shapeSepolia, shapeMainnet],
      ssr: true,
    })
  }, [])

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
