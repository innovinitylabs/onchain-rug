import { useAccount, useSendTransaction, useWalletClient } from 'wagmi'

export function useDirectMint() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { sendTransactionAsync } = useSendTransaction()

  async function mintDirect(params: {
    to: `0x${string}`
    data: `0x${string}`
    valueWei: bigint
  }) {
    if (!address) throw new Error('Wallet not connected')
    if (!walletClient) throw new Error('Wallet client unavailable')

    const hash = await sendTransactionAsync({
      to: params.to,
      data: params.data,
      value: params.valueWei,
      account: address,
    })
    return hash
  }

  return { mintDirect }
}


