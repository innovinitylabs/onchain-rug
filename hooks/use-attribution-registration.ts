import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { contractAddresses, onchainRugsABI } from '@/lib/web3'
import { generateAttributionCode } from '@/utils/base62'

/**
 * Hook for managing ERC-8021 attribution registration and status
 */
export function useAttributionRegistration() {
  const { address, chainId } = useAccount()
  const [isRegistered, setIsRegistered] = useState(false)
  const [attributionCode, setAttributionCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Contract address for current chain
  const contractAddress = contractAddresses[chainId || 1]

  // Check if user is registered
  const { data: registrationStatus, refetch: refetchRegistration } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'isRegistered' as any,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Get attribution code if registered
  const { data: userAttributionCode } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'getReferralCode' as any,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Registration functionality
  const { writeContract: writeRegister, data: registerHash, isPending: isRegistering, error: registrationError } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: registerHash,
  })

  // Update state when registration status changes
  useEffect(() => {
    if (registrationStatus !== undefined) {
      setIsRegistered(Boolean(registrationStatus))
    }
  }, [registrationStatus])

  // Update attribution code when user data changes
  useEffect(() => {
    if (userAttributionCode && typeof userAttributionCode === 'string') {
      setAttributionCode(userAttributionCode)
    } else if (address && !isRegistered) {
      // Show generated code even if not registered
      setAttributionCode(generateAttributionCode(address))
    }
  }, [userAttributionCode, address, isRegistered])

  // Register function
  const register = async () => {
    if (!address || !contractAddress || !chainId) return

    try {
      writeRegister({
        address: contractAddress as `0x${string}`,
        abi: onchainRugsABI,
        functionName: 'registerForReferrals' as any,
      } as any)
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  // Refetch registration status after confirmation
  useEffect(() => {
    if (isConfirmed) {
      refetchRegistration()
      setIsLoading(false)
    }
  }, [isConfirmed, refetchRegistration])

  // Get sharing URL
  const getSharingUrl = () => {
    if (!attributionCode) return ''
    return `${window.location.origin}?ref=${attributionCode}`
  }

  return {
    // State
    isRegistered,
    attributionCode,
    isLoading: isLoading || isRegistering || isConfirming,
    address,

    // Actions
    register,
    refetchRegistration,

    // Utilities
    getSharingUrl,

    // Transaction status
    hash: registerHash,
    isConfirming,
    isConfirmed,
    registrationError,
  }
}

/**
 * Hook for checking if an ERC-8021 attribution code is valid
 */
export function useAttributionCodeValidation(code?: string) {
  const { chainId } = useAccount()
  const contractAddress = contractAddresses[chainId || 1]

  const { data: isValid, isLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'codeExists' as any,
    args: code ? [code] : undefined,
    query: {
      enabled: !!code,
    },
  })

  return {
    isValid: !!isValid,
    isLoading,
  }
}

/**
 * Hook for getting ERC-8021 attribution statistics
 */
export function useAttributionStats(address?: string) {
  const { chainId } = useAccount()
  const contractAddress = contractAddresses[chainId || 1]

  const { data: stats, isLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'getReferralStats' as any,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    stats: stats as any,
    isLoading,
  }
}