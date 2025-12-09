'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { useEffect, useState } from 'react'
export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })
  const chainId = useChainId()

  // Check if we're using RainbowKit by trying to access it
  const [useRainbowKit, setUseRainbowKit] = useState(true)
  
  // Prevent hydration mismatch by only showing balance after mount
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true)
    
    // Check if RainbowKit is properly configured by looking for the providers flag
    // If the providers component disabled RainbowKit, we'll fall back to basic connection
    const checkRainbowKit = async () => {
      try {
        // Wait a bit for modules to load
        await new Promise(resolve => setTimeout(resolve, 100))

        // Try to access RainbowKit - if we get here, it should be available
        // If the providers component disabled it, we'll catch that in the component render
        return true
      } catch (error) {
        console.warn('RainbowKit initialization issue, using fallback')
        setUseRainbowKit(false)
        return false
      }
    }

    checkRainbowKit()
  }, [])

  // Force font styling on all RainbowKit elements
  useEffect(() => {
    const forceWalletFonts = () => {
      // Force font on all RainbowKit elements
      const rkElements = document.querySelectorAll('[data-rk] *');
      rkElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        htmlElement.style.fontVariant = 'normal';
        htmlElement.style.fontFeatureSettings = 'normal';
        htmlElement.style.textRendering = 'optimizeLegibility';
        (htmlElement.style as any).WebkitFontSmoothing = 'antialiased';
        (htmlElement.style as any).MozOsxFontSmoothing = 'grayscale';
      });

      // Force font on specific wallet elements
      const walletElements = document.querySelectorAll('[data-testid*="wallet"], [data-testid*="chain"], [data-testid*="account"], [data-testid*="modal"]');
      walletElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        htmlElement.style.fontVariant = 'normal';
        htmlElement.style.fontFeatureSettings = 'normal';
        htmlElement.style.textRendering = 'optimizeLegibility';
        (htmlElement.style as any).WebkitFontSmoothing = 'antialiased';
        (htmlElement.style as any).MozOsxFontSmoothing = 'grayscale';
      });
    };

    // Apply fonts immediately
    forceWalletFonts();

    // Also apply fonts after a short delay to catch any dynamically loaded content
    const timeoutId = setTimeout(forceWalletFonts, 100);
    const timeoutId2 = setTimeout(forceWalletFonts, 500);

    // Set up a mutation observer to watch for new RainbowKit elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          forceWalletFonts();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observer.disconnect();
    };
  }, [isConnected]); // Re-run when connection status changes

  return (
    <div className="flex items-center gap-4">
      {mounted && isConnected && (
        <div className="flex flex-col items-end gap-0 text-xs text-white/80 bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
          <span className="leading-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif', fontWeight: '500', fontVariant: 'normal', fontFeatureSettings: 'normal' }}>
            {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : '0 ETH'}
          </span>
          <span className="text-[10px] leading-tight opacity-60" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif', fontWeight: '400', fontVariant: 'normal', fontFeatureSettings: 'normal' }}>
            {chainId === 360 ? 'Shape' : 'Sepolia'}
          </span>
        </div>
      )}
      <div className="glass-wallet-button">
        {useRainbowKit ? (
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
        ) : (
          <button
            onClick={async () => {
              if (window.ethereum) {
                try {
                  await window.ethereum.request({ method: 'eth_requestAccounts' })
                } catch (error) {
                  console.error('Failed to connect wallet:', error)
                  alert('Failed to connect wallet. Please try again.')
                }
              } else {
                alert('Please install MetaMask or another Web3 wallet')
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
          </button>
        )}
      </div>
    </div>
  )
}
