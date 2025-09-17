'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { useEffect } from 'react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })
  const chainId = useChainId()

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
      {isConnected && (
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
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </div>
  )
}
