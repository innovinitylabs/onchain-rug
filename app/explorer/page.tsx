'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Database, Hexagon, FileText, Hash, Copy, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface BlockData {
  number: string
  hash: string
  timestamp: string
  gasUsed: string
  gasLimit: string
  transactions: any[]
}

interface TransactionData {
  hash: string
  from: string
  to: string | null
  value: string
  gasPrice: string
  gasLimit: string
  gasUsed?: string
  status?: number
  blockNumber: string
  input: string
  logs?: any[]
}

interface ContractData {
  address: string
  code: string
  storage?: Record<string, string>
  name?: string
  index?: number
}

export default function ExplorerPage() {
  const [activeTab, setActiveTab] = useState<'blocks' | 'transactions' | 'contracts'>('blocks')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'block' | 'tx' | 'address'>('block')
  const [blocks, setBlocks] = useState<BlockData[]>([])
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBlocks, setLoadingBlocks] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showConverters, setShowConverters] = useState(false)
  const [converterInput, setConverterInput] = useState('')
  const [converterOutput, setConverterOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [detailedData, setDetailedData] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now())
  const [showAsText, setShowAsText] = useState<Record<string, boolean>>({})

  // Anvil local RPC URL
  const anvilUrl = 'http://127.0.0.1:8545'

  // Fetch latest blocks
  const fetchBlocks = useCallback(async () => {
    setLoadingBlocks(true)
    setError(null)
    try {
      // Get latest block number
      const blockNumberResponse = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      })
      const blockNumberData = await blockNumberResponse.json()
      const latestBlockNumber = parseInt(blockNumberData.result, 16)

      // Fetch last 10 blocks (or fewer if blockchain has fewer blocks)
      const blockPromises = []
      const blocksToFetch = Math.min(10, latestBlockNumber + 1) // Don't fetch more blocks than exist

      for (let i = 0; i < blocksToFetch; i++) {
        const blockNum = latestBlockNumber - i
        blockPromises.push(fetchBlock(blockNum))
      }

      const blockData = await Promise.all(blockPromises)
      const filteredBlocks = blockData.filter(block => block !== null)
      setBlocks(filteredBlocks)
    } catch (err) {
      setError('Failed to fetch blocks from Anvil')
      console.error(err)
    } finally {
      setLoadingBlocks(false)
    }
  }, [anvilUrl])

  // Fetch transactions from recent blocks
  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    setError(null)
    try {
      // Get latest block number
      const blockNumberResponse = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      })
      const blockNumberData = await blockNumberResponse.json()
      const latestBlockNumber = parseInt(blockNumberData.result, 16)

      // Fetch transactions from last 5 blocks
      const txPromises = []
      for (let i = 0; i < Math.min(5, latestBlockNumber + 1); i++) {
        const blockNum = Math.max(0, latestBlockNumber - i)
        txPromises.push(fetchTransactionsFromBlock(blockNum))
      }

      const txArrays = await Promise.all(txPromises)
      const allTransactions = txArrays.flat().slice(0, 20) // Limit to 20 transactions
      setTransactions(allTransactions)
    } catch (err) {
      setError('Failed to fetch transactions from Anvil')
      console.error(err)
    } finally {
      setLoadingTransactions(false)
    }
  }, [anvilUrl])

  // Fetch transactions from a specific block
  const fetchTransactionsFromBlock = async (blockNumber: number): Promise<TransactionData[]> => {
    try {
      const response = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: [`0x${blockNumber.toString(16)}`, true]
        })
      })
      const data = await response.json()

      if (data.result && data.result.transactions) {
        const txPromises = data.result.transactions.slice(0, 5).map(async (tx: any) => {
          // Get transaction receipt for status
          const receiptResponse = await fetch(anvilUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'eth_getTransactionReceipt',
              params: [tx.hash]
            })
          })
          const receiptData = await receiptResponse.json()

          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            gasUsed: receiptData.result?.gasUsed,
            status: receiptData.result?.status ? parseInt(receiptData.result.status, 16) : undefined,
            blockNumber: tx.blockNumber,
            input: tx.input,
            logs: receiptData.result?.logs
          }
        })

        return await Promise.all(txPromises)
      }
      return []
    } catch (err) {
      console.error(`Failed to fetch transactions from block ${blockNumber}:`, err)
      return []
    }
  }

  // Fetch contracts from recent transactions
  const fetchContracts = useCallback(async () => {
    setLoadingContracts(true)
    setError(null)
    try {
      // Get latest block number
      const blockNumberResponse = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: []
        })
      })
      const blockNumberData = await blockNumberResponse.json()
      const latestBlockNumber = parseInt(blockNumberData.result, 16)

      // Fetch contracts from last 10 blocks
      const contractPromises = []
      for (let i = 0; i < Math.min(10, latestBlockNumber + 1); i++) {
        const blockNum = Math.max(0, latestBlockNumber - i)
        contractPromises.push(fetchContractsFromBlock(blockNum))
      }

      const contractArrays = await Promise.all(contractPromises)
      const allContracts = contractArrays.flat()
      // Remove duplicates based on address
      const uniqueContracts = allContracts.filter((contract, index, self) =>
        index === self.findIndex(c => c.address === contract.address)
      ).slice(0, 10) // Limit to 10 contracts

      // Add index numbers to contracts
      const numberedContracts = uniqueContracts.map((contract, index) => ({
        ...contract,
        index: index + 1
      }))

      setContracts(numberedContracts)
    } catch (err) {
      setError('Failed to fetch contracts from Anvil')
      console.error(err)
    } finally {
      setLoadingContracts(false)
    }
  }, [anvilUrl])

  // Fetch contracts from a specific block
  const fetchContractsFromBlock = async (blockNumber: number): Promise<ContractData[]> => {
    try {
      const response = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: [`0x${blockNumber.toString(16)}`, true]
        })
      })
      const data = await response.json()

      if (data.result && data.result.transactions) {
        const contractPromises = data.result.transactions
          .filter((tx: any) => !tx.to) // Contract creation transactions
          .slice(0, 3) // Limit per block
          .map(async (tx: any) => {
            // Get transaction receipt to find contract address
            const receiptResponse = await fetch(anvilUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'eth_getTransactionReceipt',
                params: [tx.hash]
              })
            })
            const receiptData = await receiptResponse.json()

            if (receiptData.result?.contractAddress) {
              const contractData = await fetchContract(receiptData.result.contractAddress)
              return contractData
            }
            return null
          })

        const contracts = await Promise.all(contractPromises)
        return contracts.filter(contract => contract !== null)
      }
      return []
    } catch (err) {
      console.error(`Failed to fetch contracts from block ${blockNumber}:`, err)
      return []
    }
  }

  const fetchBlock = async (blockNumber: number): Promise<BlockData | null> => {
    try {
      const response = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: [`0x${blockNumber.toString(16)}`, true]
        })
      })
      const data = await response.json()
      if (data.result) {
        return {
          number: data.result.number,
          hash: data.result.hash,
          timestamp: new Date(parseInt(data.result.timestamp, 16) * 1000).toISOString(),
          gasUsed: data.result.gasUsed,
          gasLimit: data.result.gasLimit,
          transactions: data.result.transactions
        }
      }
      return null
    } catch (err) {
      console.error(`Failed to fetch block ${blockNumber}:`, err)
      return null
    }
  }

  const fetchTransaction = async (txHash: string): Promise<TransactionData | null> => {
    try {
      const response = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionByHash',
          params: [txHash]
        })
      })
      const data = await response.json()
      if (data.result) {
        // Also get transaction receipt for status and gas used
        const receiptResponse = await fetch(anvilUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          })
        })
        const receiptData = await receiptResponse.json()

        return {
          hash: data.result.hash,
          from: data.result.from,
          to: data.result.to,
          value: data.result.value,
          gasPrice: data.result.gasPrice,
          gasLimit: data.result.gasLimit,
          gasUsed: receiptData.result?.gasUsed,
          status: receiptData.result?.status ? parseInt(receiptData.result.status, 16) : undefined,
          blockNumber: data.result.blockNumber,
          input: data.result.input,
          logs: receiptData.result?.logs
        }
      }
      return null
    } catch (err) {
      console.error(`Failed to fetch transaction ${txHash}:`, err)
      return null
    }
  }

  const resolveContractName = async (address: string, bytecode: string): Promise<string> => {
    try {

      // Try eth_call with ERC721/ERC20 name() selector (0x06fdde03) and decode the string
      try {
        const nameResponse = await fetch(anvilUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [{
              to: address,
              data: '0x06fdde03' // name() function signature
            }, 'latest']
          })
        })
        const nameData = await nameResponse.json()
        if (nameData.result && nameData.result !== '0x') {
          // Handle hex decoding carefully (strip 0x, group into bytes, TextDecoder into UTF-8)
          const resultHex = nameData.result.replace(/^0x/, '')
          if (resultHex.length >= 128) { // At least 64 bytes for offset + 32 bytes for length + some data
            const resultBytes = new Uint8Array(resultHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])

            // Read the offset (first 32 bytes, big-endian)
            const offset = (resultBytes[28] << 24) | (resultBytes[29] << 16) | (resultBytes[30] << 8) | resultBytes[31]

            if (offset >= 64 && offset < resultBytes.length) {
              // Read the length (32 bytes starting from offset)
              const length = (resultBytes[offset + 28] << 24) | (resultBytes[offset + 29] << 16) | (resultBytes[offset + 30] << 8) | resultBytes[offset + 31]

              if (length > 0 && length < 100 && offset + 32 + length <= resultBytes.length) {
                // Extract the string data
                const stringBytes = resultBytes.slice(offset + 32, offset + 32 + length)
                const name = new TextDecoder('utf-8').decode(stringBytes)
                if (name && name.length > 0) {
                  return name
                }
              }
            }
          }
        }
      } catch (e) {
        // ERC721/ERC20 name() call failed, continue
      }


      // Parse the Solidity metadata CBOR blob at the end of bytecode
      // The blob begins with a165627a7a72305820 or a2646970667358
      const metadataPattern = /(a165627a7a72305820|a2646970667358)([0-9a-f]*)$/i
      const metadataMatch = bytecode.match(metadataPattern)
      if (metadataMatch) {
        try {
          const metadataHex = metadataMatch[2]
          if (metadataHex.length > 0) {
            // Convert hex to bytes carefully
            const cleanHex = metadataHex.replace(/^0x/, '')
            const metadataBytes = new Uint8Array(cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])

            // Try to decode as UTF-8 string
            const metadataString = new TextDecoder('utf-8').decode(metadataBytes)

            // Look for "contractName": "..." in the embedded JSON
            const nameMatch = metadataString.match(/"contractName"\s*:\s*"([^"]+)"/)
            if (nameMatch && nameMatch[1]) {
              return nameMatch[1]
            }
          }
        } catch (e) {
          // Metadata decoding failed, continue with other methods
        }
      }

      // Check for common contract patterns in bytecode
      if (bytecode.includes('608060405234801561001057600080fd5b50d3801561001d57600080fd5b50d2801561002a57600080fd5b5060')) {
        // Looks like a proxy contract
        return 'Proxy Contract'
      }

      // Check for diamond pattern (delegatecall usage)
      if (bytecode.includes('5af43d82803e903d91602b57fd5bf3')) {
        return 'Diamond Contract'
      }

      // Fallback: Use bytecode hash as identifier
      const hash = bytecode.slice(0, 10)
      return `Contract_${hash.slice(2, 8).toUpperCase()}`

    } catch (err) {
      return 'Unknown Contract'
    }
  }

  const fetchContract = async (address: string): Promise<ContractData | null> => {
    try {
      const codeResponse = await fetch(anvilUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getCode',
          params: [address, 'latest']
        })
      })
      const codeData = await codeResponse.json()

      if (codeData.result && codeData.result !== '0x') {
        const name = await resolveContractName(address, codeData.result)
        return {
          address,
          code: codeData.result,
          name
        }
      }
      return null
    } catch (err) {
      console.error(`Failed to fetch contract ${address}:`, err)
      return null
    }
  }

  const search = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setSelectedItem(null)
    setShowDetails(false)
    setShowAsText({})

    try {
      switch (searchType) {
        case 'block':
          const blockNum = parseInt(searchQuery, searchQuery.startsWith('0x') ? 16 : 10)
          const block = await fetchBlock(blockNum)
          if (block) {
            setBlocks([block])
            setCurrentBlockNumber(blockNum)
            // Switch to blocks tab to show the result
            setActiveTab('blocks')
          } else {
            setError('Block not found')
          }
          break

        case 'tx':
          const tx = await fetchTransaction(searchQuery)
          if (tx) {
            setTransactions([tx])
            setSelectedItem(tx)
            // Switch to transactions tab to show the result
            setActiveTab('transactions')
          } else {
            setError('Transaction not found')
          }
          break

        case 'address':
          const contract = await fetchContract(searchQuery)
          if (contract) {
            const numberedContract = { ...contract, index: 1 }
            setContracts([numberedContract])
            setSelectedItem(numberedContract)
            // Switch to contracts tab to show the result
            setActiveTab('contracts')
          } else {
            setError('Contract not found or address has no code')
          }
          break
      }
    } catch (err) {
      setError('Search failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedData = async (item: any, type: 'block' | 'transaction' | 'contract') => {
    setLoadingDetails(true)
    setShowDetails(true)

    try {
      switch (type) {
        case 'block':
          const blockResponse = await fetch(anvilUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getBlockByNumber',
              params: [item.number, true]
            })
          })
          const blockData = await blockResponse.json()
          setDetailedData(blockData.result)
          break

        case 'transaction':
          const txResponse = await fetch(anvilUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionByHash',
              params: [item.hash]
            })
          })
          const txData = await txResponse.json()

          const receiptResponse = await fetch(anvilUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'eth_getTransactionReceipt',
              params: [item.hash]
            })
          })
          const receiptData = await receiptResponse.json()

          setDetailedData({
            transaction: txData.result,
            receipt: receiptData.result
          })
          break

        case 'contract':
          const codeResponse = await fetch(anvilUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getCode',
              params: [item.address, 'latest']
            })
          })
          const codeData = await codeResponse.json()

          // Get storage slots (first 10)
          const storagePromises = []
          for (let i = 0; i < 10; i++) {
            storagePromises.push(fetch(anvilUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: i + 2,
                method: 'eth_getStorageAt',
                params: [item.address, `0x${i.toString(16)}`, 'latest']
              })
            }))
          }

          const storageResponses = await Promise.all(storagePromises)
          const storageData = await Promise.all(storageResponses.map(r => r.json()))

          setDetailedData({
            address: item.address,
            code: codeData.result,
            storage: storageData.map((data, index) => ({
              slot: `0x${index.toString(16)}`,
              value: data.result
            })).filter(item => item.value !== '0x0000000000000000000000000000000000000000000000000000000000000000')
          })
          break
      }
    } catch (err) {
      console.error('Failed to fetch detailed data:', err)
      setError('Failed to fetch detailed data')
    } finally {
      setLoadingDetails(false)
    }
  }

  const hexToBase64 = (input: string) => {
    try {
      let hex = input.startsWith('0x') ? input.slice(2) : input
      // Ensure even length
      if (hex.length % 2 !== 0) hex = '0' + hex

      const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
      const base64 = btoa(String.fromCharCode(...bytes))
      setConverterOutput(base64)
    } catch (err) {
      setConverterOutput('Invalid hex input')
    }
  }

  const base64ToHex = (input: string) => {
    try {
      const bytes = Uint8Array.from(atob(input), c => c.charCodeAt(0))
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
      setConverterOutput('0x' + hex)
    } catch (err) {
      setConverterOutput('Invalid base64 input')
    }
  }

  const hexToText = (input: string) => {
    try {
      let hex = input.startsWith('0x') ? input.slice(2) : input
      // Ensure even length
      if (hex.length % 2 !== 0) hex = '0' + hex

      const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])

      // Convert to text, replacing non-printable characters
      let text = ''
      for (const byte of bytes) {
        if (byte >= 32 && byte <= 126) {
          // Printable ASCII
          text += String.fromCharCode(byte)
        } else if (byte === 10) {
          // Newline
          text += '\n'
        } else if (byte === 13) {
          // Carriage return
          text += '\r'
        } else if (byte === 9) {
          // Tab
          text += '\t'
        } else {
          // Non-printable character, show as [HEX]
          text += `[${byte.toString(16).padStart(2, '0').toUpperCase()}]`
        }
      }

      return text
    } catch (err) {
      return 'Invalid hex input'
    }
  }

  const toggleHexText = (key: string) => {
    setShowAsText(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const navigateToBlock = async (blockNumber: number) => {
    if (blockNumber < 0) return

    setLoading(true)
    setError(null)
    try {
      const block = await fetchBlock(blockNumber)
      if (block) {
        setBlocks([block])
        setCurrentBlockNumber(blockNumber)
      } else {
        setError('Block not found')
      }
    } catch (err) {
      setError('Failed to fetch block')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Global refresh function to clear all cached data
  const globalRefresh = () => {
    setBlocks([])
    setTransactions([])
    setContracts([])
    setSelectedItem(null)
    setShowDetails(false)
    setDetailedData(null)
    setCurrentBlockNumber(null)
    setShowAsText({})
    setLastRefresh(Date.now())
  }

  useEffect(() => {
    if (activeTab === 'blocks') {
      fetchBlocks()
    } else if (activeTab === 'transactions') {
      fetchTransactions()
    } else if (activeTab === 'contracts') {
      fetchContracts()
    }
  }, [activeTab, lastRefresh])

  // Clear data on component mount to ensure fresh data after Anvil reload
  useEffect(() => {
    globalRefresh()
  }, [])

  const formatValue = (value: string) => {
    const num = parseInt(value, 16)
    return (num / 1e18).toFixed(4) + ' ETH'
  }

  const formatGas = (gas: string) => {
    return parseInt(gas, 16).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <Navigation />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 pt-24"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-6xl md:text-7xl font-bold gradient-text">
            🔍 Blockchain Explorer
          </h1>
          <button
            onClick={globalRefresh}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            title="Refresh all data"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh All
          </button>
        </div>
        <p className="text-xl text-blue-700 max-w-3xl mx-auto mb-8">
          Explore your local Anvil blockchain - view blocks, transactions, contracts, and metadata
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Search Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-4 py-3 bg-white/80 border border-blue-200 rounded-lg text-blue-700"
            >
              <option value="block">Block Number</option>
              <option value="tx">Transaction Hash</option>
              <option value="address">Contract Address</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Enter ${searchType}...`}
              className="flex-1 px-4 py-3 bg-white/80 border border-blue-200 rounded-lg text-blue-700"
              onKeyPress={(e) => e.key === 'Enter' && search()}
            />
            <button
              onClick={search}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowConverters(!showConverters)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
            >
              {showConverters ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              Converters
            </button>
          </div>

          {/* Converters */}
          {showConverters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Converters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                  <textarea
                    value={converterInput}
                    onChange={(e) => setConverterInput(e.target.value)}
                    placeholder="Enter data to convert..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
                  <textarea
                    value={converterOutput}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => hexToBase64(converterInput)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Hexagon className="w-4 h-4 inline mr-2" />
                  Hex → Base64
                </button>
                <button
                  onClick={() => base64ToHex(converterInput)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Base64 → Hex
                </button>
                <button
                  onClick={() => copyToClipboard(converterOutput)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 inline mr-2" /> : <Copy className="w-4 h-4 inline mr-2" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 relative z-10">
          {[
            { id: 'blocks', label: 'Blocks', icon: Database },
            { id: 'transactions', label: 'Transactions', icon: Hash },
            { id: 'contracts', label: 'Contracts', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-white/60 text-blue-600 hover:bg-blue-50 border border-blue-200/50 hover:bg-blue-100'
              }`}
              style={{ pointerEvents: 'auto', zIndex: 20 }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Details Panel */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-200/50 mb-8"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-800">Detailed Data</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-blue-600">Loading details...</span>
                </div>
              ) : detailedData ? (
                <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="p-4">
                    <h4 className="text-white font-medium mb-3">Raw JSON Data</h4>
                    <pre className="text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(detailedData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-600">
                  Failed to load detailed data
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-200/50">
          <>
              {/* Blocks Tab */}
              {activeTab === 'blocks' && (
                <div className="p-6">
                  {loadingBlocks ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-blue-600">Loading blocks...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-blue-800">
                          {blocks.length === 1 && currentBlockNumber !== null ? `Block #${currentBlockNumber}` : 'Recent Blocks'}
                        </h2>
                        <div className="flex items-center gap-2">
                          {blocks.length === 1 && currentBlockNumber !== null && (
                            <>
                              <button
                                onClick={() => navigateToBlock(currentBlockNumber - 1)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                                disabled={currentBlockNumber <= 0}
                              >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                              </button>
                              <button
                                onClick={() => navigateToBlock(currentBlockNumber + 1)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                                disabled={currentBlockNumber >= 1000} // Reasonable upper limit
                              >
                                Next
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={fetchBlocks}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            {blocks.length === 1 ? 'Back to Recent' : 'Refresh'}
                          </button>
                        </div>
                      </div>
                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <div key={`${block.number}-${block.hash}-${index}`} className="bg-white/80 rounded-lg p-4 border border-blue-200/50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-blue-600">Block</div>
                            <div className="font-mono text-blue-800">#{parseInt(block.number, 16)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-blue-600">Hash</div>
                            <div className="font-mono text-blue-800 text-sm truncate">{block.hash}</div>
                          </div>
                          <div>
                            <div className="text-sm text-blue-600">Timestamp</div>
                            <div className="text-blue-800">{new Date(block.timestamp).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-blue-600">Transactions</div>
                            <div className="text-blue-800">{block.transactions.length}</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-blue-600">Gas Used</div>
                            <div className="text-blue-800">{formatGas(block.gasUsed)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-blue-600">Gas Limit</div>
                            <div className="text-blue-800">{formatGas(block.gasLimit)}</div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => fetchDetailedData(block, 'block')}
                            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors text-sm"
                          >
                            View Raw Data
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                      {blocks.length === 0 && !loadingBlocks && (
                        <div className="text-center py-12">
                          <Database className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-700">No blocks found. Try refreshing or check if Anvil is running.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="p-6">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-blue-600">Loading transactions...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-blue-800">Recent Transactions</h2>
                        <button
                          onClick={fetchTransactions}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                      </div>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((tx) => (
                        <div key={tx.hash} className="bg-white/80 rounded-lg p-4 border border-blue-200/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-blue-600">Hash</div>
                              <div className="font-mono text-blue-800 text-sm break-all">{tx.hash}</div>
                            </div>
                            <div>
                              <div className="text-sm text-blue-600">Block</div>
                              <div className="font-mono text-blue-800">#{parseInt(tx.blockNumber, 16)}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-blue-600">From</div>
                              <div className="font-mono text-blue-800 text-sm break-all">{tx.from}</div>
                            </div>
                            <div>
                              <div className="text-sm text-blue-600">To</div>
                              <div className="font-mono text-blue-800 text-sm break-all">{tx.to || 'Contract Creation'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-blue-600">Value</div>
                              <div className="text-blue-800">{formatValue(tx.value)}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-blue-600">Gas Price</div>
                              <div className="text-blue-800">{parseInt(tx.gasPrice, 16)} wei</div>
                            </div>
                            <div>
                              <div className="text-sm text-blue-600">Gas Limit</div>
                              <div className="text-blue-800">{formatGas(tx.gasLimit)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-blue-600">Status</div>
                              <div className={`flex items-center gap-2 ${tx.status === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.status === 1 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {tx.status === 1 ? 'Success' : 'Failed'}
                              </div>
                            </div>
                          </div>
                          {tx.input && tx.input !== '0x' && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-blue-600">Input Data</div>
                                <button
                                  onClick={() => toggleHexText(`tx-${tx.hash}`)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors"
                                >
                                  {showAsText[`tx-${tx.hash}`] ? 'Show Hex' : 'Show Text'}
                                </button>
                              </div>
                              <div className="bg-gray-50 p-3 rounded font-mono text-sm break-all max-h-32 overflow-y-auto text-gray-900">
                                {showAsText[`tx-${tx.hash}`] ? hexToText(tx.input) : tx.input}
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => fetchDetailedData(tx, 'transaction')}
                              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors text-sm"
                            >
                              View Raw Data
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                      ) : (
                        <div className="text-center py-12">
                          <Database className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-700">No recent transactions found. Try refreshing or search for a specific transaction hash above.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Contracts Tab */}
              {activeTab === 'contracts' && (
                <div className="p-6">
                  {loadingContracts ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-blue-600">Loading contracts...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-blue-800">
                          Deployed Contracts ({contracts.length})
                        </h2>
                        <button
                          onClick={fetchContracts}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Refresh
                        </button>
                      </div>
                      <div className="space-y-4">
                        {contracts.map((contract) => (
                          <div key={contract.address} className="bg-white/80 rounded-lg p-4 border border-blue-200/50">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                                  {contract.index}
                                </div>
                                <div>
                                  <div className="text-lg font-semibold text-blue-800">{contract.name || 'Unknown Contract'}</div>
                                  <div className="text-sm text-blue-600">Contract #{contract.index}</div>
                                </div>
                              </div>
                            </div>
                            <div className="mb-4">
                              <div className="text-sm text-blue-600">Contract Address</div>
                              <div className="font-mono text-blue-800 break-all">{contract.address}</div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-blue-600">Bytecode</div>
                                <button
                                  onClick={() => toggleHexText(`contract-${contract.address}`)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors"
                                >
                                  {showAsText[`contract-${contract.address}`] ? 'Show Hex' : 'Show Text'}
                                </button>
                              </div>
                              <div className="bg-gray-50 p-3 rounded font-mono text-sm break-all max-h-48 overflow-y-auto text-gray-900">
                                {showAsText[`contract-${contract.address}`] ? hexToText(contract.code) : contract.code}
                              </div>
                            </div>
                            <div className="mt-4 text-sm text-blue-600">
                              Code Size: {contract.code.length / 2 - 1} bytes
                            </div>
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => fetchDetailedData(contract, 'contract')}
                                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors text-sm"
                              >
                                View Raw Data
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {contracts.length === 0 && !loadingContracts && (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-700">No deployed contracts found in recent blocks. Try refreshing or search for a specific contract address above.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
          </>
        </div>
      </div>
    </div>
  )
}
