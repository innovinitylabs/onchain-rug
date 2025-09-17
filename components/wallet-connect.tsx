'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId } from 'wagmi'
import { formatEther } from 'viem'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })
  const chainId = useChainId()

  return (
    <div className="flex items-center gap-4">
      {isConnected && (
        <div className="flex flex-col items-end gap-0 text-xs text-white/80 bg-white/10 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
          <span className="leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : '0 ETH'}
          </span>
          <span className="text-[10px] leading-tight opacity-60" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
