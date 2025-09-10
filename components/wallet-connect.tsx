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
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
          <span className="font-mono">
            {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : '0 ETH'}
          </span>
          <span className="text-gray-400">•</span>
          <span className="font-mono">
            {chainId === 360 ? 'Shape Mainnet' : 'Shape Sepolia'}
          </span>
        </div>
      )}
      <ConnectButton 
        showBalance={false}
        chainStatus="icon"
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
    </div>
  )
}
