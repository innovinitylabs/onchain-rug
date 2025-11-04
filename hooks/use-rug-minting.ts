import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi'
import { useState } from 'react'
import { config, mintingConfig } from '@/lib/config'
import { shapeSepolia, shapeMainnet, contractAddresses } from '@/lib/web3'
import { DESTINATION_SHAPE_ID } from '@/config/chains'
import { encodeFunctionData } from 'viem'
import { useRelayMint } from './use-relay-mint'

// Hook for minting rugs with deterministic seed generation
export function useRugMinting() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const { mintCrossChain } = useRelayMint()

  // Get current mint price
  const { data: mintPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'mintPrice',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'mintPrice',
  })

  // Get current supply
  const { data: currentSupply } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'totalSupply',
  })

  // Get max supply
  const { data: maxSupply } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'MAX_SUPPLY',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'MAX_SUPPLY',
  })

  const mintRug = async (seed?: number, textLines?: string[], svgArt?: string) => {
    if (!writeContract) return

    // Generate deterministic seed if not provided (using large range to prevent repetition)
    const finalSeed = seed || Math.floor(Math.random() * 1000000)

    // Calculate minting price based on text lines
    const mintingPrice = calculateMintingPrice(textLines || [])

    // Generate SVG art if not provided
    const finalSvgArt = svgArt || await generateRugSVG(finalSeed, textLines || [])

    try {
      // If already on destination chain (Shape), use direct path (legacy function kept for compatibility)
      if (chainId === DESTINATION_SHAPE_ID) {
        const chain = chainId === 360 ? shapeMainnet : shapeSepolia
        await writeContract({
          address: contractAddress as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: 'textLines', type: 'string[]' },
                { name: 'seed', type: 'uint256' },
                { name: 'svgArt', type: 'string' }
              ],
              name: 'mintWithText',
              outputs: [],
              stateMutability: 'payable',
              type: 'function',
            },
          ] as const,
          functionName: 'mintWithText',
          args: [textLines || [], BigInt(finalSeed), finalSvgArt],
          value: BigInt(mintingPrice),
          chain,
          account: address,
        })
        return
      }

      // Else: prepare a cross-chain quote (example for Relay flow)
      const recipient = address as `0x${string}`
      const callData = encodeFunctionData({
        abi: [
          {
            inputs: [
              { name: 'recipient', type: 'address' },
              { name: 'textRows', type: 'string[]' },
              { name: 'seed', type: 'uint256' },
              { name: 'visual', type: 'tuple', components: [
                { name: 'warpThickness', type: 'uint8' },
                { name: 'stripeCount', type: 'uint256' },
              ] },
              { name: 'art', type: 'tuple', components: [
                { name: 'paletteName', type: 'string' },
                { name: 'minifiedPalette', type: 'string' },
                { name: 'minifiedStripeData', type: 'string' },
                { name: 'filteredCharacterMap', type: 'string' },
              ] },
              { name: 'complexity', type: 'uint8' },
              { name: 'characterCount', type: 'uint256' },
            ],
            name: 'mintRugFor',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
          }
        ] as const,
        functionName: 'mintRugFor',
        args: [
          recipient,
          textLines || [],
          BigInt(finalSeed),
          { warpThickness: 2, stripeCount: BigInt(0) },
          { paletteName: 'Default', minifiedPalette: '{}', minifiedStripeData: '[]', filteredCharacterMap: '{}' },
          0,
          BigInt((textLines || []).join('').length),
        ],
      })

      await mintCrossChain({
        recipient,
        textRows: textLines || [],
        seed: BigInt(finalSeed),
        visual: { warpThickness: 2, stripeCount: 0 },
        art: { paletteName: 'Default', minifiedPalette: '{}', minifiedStripeData: '[]', filteredCharacterMap: '{}' },
        complexity: 0,
        characterCount: BigInt((textLines || []).join('').length),
        valueWei: BigInt(mintingPrice),
      })
    } catch (err) {
      console.error('Failed to mint rug:', err)
    }
  }

  // Generate SVG art using existing P5.js algorithm
  const generateRugSVG = async (seed: number, textLines: string[]): Promise<string> => {
    // This will be implemented to use the existing P5.js algorithm
    // For now, return a placeholder
    return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f0f0f0"/>
      <text x="200" y="200" text-anchor="middle" font-family="monospace">Rug #${seed}</text>
    </svg>`
  }

  // Calculate minting price based on text lines
  const calculateMintingPrice = (textLines: string[]): string => {
    if (textLines.length <= 1) return mintingConfig.basePrice

    let totalPrice = BigInt(mintingConfig.basePrice)
    
    // Add pricing for additional lines
    for (let i = 1; i < textLines.length; i++) {
      if (i === 1 || i === 2) { // Lines 2-3
        totalPrice += BigInt(mintingConfig.textPricing.line2)
      } else if (i === 3 || i === 4) { // Lines 4-5
        totalPrice += BigInt(mintingConfig.textPricing.line4)
      }
    }
    
    return totalPrice.toString()
  }

  return {
    mintRug,
    mintPrice,
    currentSupply,
    maxSupply,
    calculateMintingPrice,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook for getting user's rugs
export function useUserRugs() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId]

  // Get user's rug count
  const { data: balance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Get user's rug token IDs
  const { data: tokenIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'index', type: 'uint256' }
        ],
        name: 'tokenOfOwnerByIndex',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'tokenOfOwnerByIndex',
    args: address && balance ? [address, BigInt(0)] : undefined,
    query: {
      enabled: !!address && !!balance && balance > 0,
    },
  })

  return {
    balance,
    tokenIds,
  }
}
