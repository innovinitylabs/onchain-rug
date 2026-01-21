import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import { contractAddresses, onchainRugsABI } from '@/lib/web3'
import { generateReferralCode } from '@/utils/base62'

/**
 * Hook for managing referral registration and status
 */
export function useReferralRegistration() {
  const { address, chainId } = useAccount()
  const [isRegistered, setIsRegistered] = useState(false)
  const [referralCode, setReferralCode] = useState('')
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

  // Get referral code if registered
  const { data: userReferralCode } = useReadContract({
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

  // Update referral code when user data changes
  useEffect(() => {
    if (userReferralCode && typeof userReferralCode === 'string') {
      setReferralCode(userReferralCode)
    } else if (address && !isRegistered) {
      // Show generated code even if not registered
      setReferralCode(generateReferralCode(address))
    }
  }, [userReferralCode, address, isRegistered])

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
    if (!referralCode) return ''
    return `${window.location.origin}?ref=${referralCode}`
  }

  return {
    // State
    isRegistered,
    referralCode,
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
 * Hook for checking if a referral code is valid
 */
export function useReferralCodeValidation(code?: string) {
  const { chainId } = useAccount()
  const contractAddress = contractAddresses[chainId || 1]

  const { data: isValid, isLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: onchainRugsABI,
    functionName: 'codeExists' as any,
    args: code ? [`ref-${code}`] : undefined,
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
 * Hook for getting referral statistics
 */
export function useReferralStats(address?: string) {
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