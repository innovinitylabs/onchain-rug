'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig, Theme } from '@rainbow-me/rainbowkit'
import { config as appConfig } from '@/lib/config'
import { shapeSepolia, shapeMainnet, baseSepolia, baseMainnet } from '@/lib/web3'

// Simple wagmi config for basic functionality
import { createConfig, http } from 'wagmi'

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css'

// Create a client for React Query
const queryClient = new QueryClient()

// Custom glass theme for RainbowKit
const glassTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(20px)',
  },
  colors: {
    accentColor: '#06b6d4', // cyan-500
    accentColorForeground: '#ffffff',
    actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
    actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
    actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.1)',
    closeButton: '#94a3b8',
    closeButtonBackground: 'rgba(255, 255, 255, 0.1)',
    connectButtonBackground: 'rgba(255, 255, 255, 0.1)',
    connectButtonBackgroundError: '#ef4444',
    connectButtonInnerBackground: 'rgba(255, 255, 255, 0.1)',
    connectButtonText: '#ffffff',
    connectButtonTextError: '#ffffff',
    connectionIndicator: '#10b981',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(255, 255, 255, 0.1) 9.49%, rgba(255, 255, 255, 0.05) 71.04%)',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(255, 255, 255, 0.1) 9.49%, rgba(255, 255, 255, 0.05) 71.04%)',
    error: '#ef4444',
    generalBorder: 'rgba(255, 255, 255, 0.1)',
    generalBorderDim: 'rgba(255, 255, 255, 0.05)',
    menuItemBackground: 'rgba(255, 255, 255, 0.1)',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBackground: 'rgba(255, 255, 255, 0.1)',
    modalBorder: 'rgba(255, 255, 255, 0.1)',
    modalText: '#ffffff',
    modalTextDim: '#94a3b8',
    modalTextSecondary: '#64748b',
    profileAction: 'rgba(255, 255, 255, 0.1)',
    profileActionHover: 'rgba(255, 255, 255, 0.05)',
    profileForeground: 'rgba(255, 255, 255, 0.1)',
    selectedOptionBorder: '#06b6d4',
    standby: '#64748b',
  },
  fonts: {
    body: 'system-ui, -apple-system, sans-serif',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    menuButton: '12px',
    modal: '16px',
    modalMobile: '16px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(0, 0, 0, 0.1)',
    dialog: '0 8px 32px rgba(0, 0, 0, 0.12)',
    profileDetailsAction: '0 2px 6px rgba(0, 0, 0, 0.15)',
    selectedOption: '0 0 0 1px #06b6d4',
    selectedWallet: '0 0 0 1px #06b6d4',
    walletLogo: '0 2px 16px rgba(0, 0, 0, 0.04)',
  },
}

// Create stable RainbowKit config outside component to prevent re-initialization
const projectId = appConfig.walletConnectProjectId || '3430b69b272c72262b35b3c106ff9d81'

if (!appConfig.walletConnectProjectId) {
  console.warn('WalletConnect Project ID not found in config. Using fallback. Set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID environment variable.')
}

console.log('WalletConnect Project ID:', projectId)

// Create a simple wagmi config as fallback
const simpleWagmiConfig = createConfig({
  chains: [shapeSepolia, shapeMainnet, baseSepolia, baseMainnet],
  transports: {
    [shapeSepolia.id]: http(),
    [shapeMainnet.id]: http(),
    [baseSepolia.id]: http(),
    [baseMainnet.id]: http(),
  },
})

// Try to create RainbowKit config safely
let rainbowKitConfig;
export let useRainbowKit = true;

try {
  rainbowKitConfig = getDefaultConfig({
  appName: 'Onchain Rugs',
  projectId: projectId,
  chains: [shapeSepolia, shapeMainnet, baseSepolia, baseMainnet],
  ssr: true,
})
} catch (error) {
  console.error('Failed to initialize RainbowKit config, falling back to simple wagmi:', error)
  rainbowKitConfig = simpleWagmiConfig
  useRainbowKit = false
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={rainbowKitConfig}>
      <QueryClientProvider client={queryClient}>
        {useRainbowKit ? (
          <RainbowKitProvider theme={glassTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
        ) : (
          <>{children}</>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
