'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import LiquidGlass from '@/components/LiquidGlass'
import LoadingAnimation from '@/components/LoadingAnimation'
import { Settings, Shield, DollarSign, Clock, Users, Code, AlertCircle, Calculator, ArrowUpDown } from 'lucide-react'

export default function AdminPage() {
  const [isLocal, setIsLocal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if running on localhost
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '')

    setIsLocal(isLocalhost)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingAnimation message="Loading..." size="lg" />
      </div>
    )
  }

  if (!isLocal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/70">Admin panel is only accessible locally</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">OnchainRugs Admin</h1>
          </div>
          <p className="text-white/70">Manage smart contract parameters and configuration</p>
        </motion.div>

        {/* Admin Sections */}
        <div className="grid gap-8 max-w-6xl mx-auto">
          {/* Collection Management */}
          <AdminSection
            icon={<Shield className="w-6 h-6" />}
            title="Collection Management"
            description="Control supply limits and wallet restrictions"
            functions={[
              {
                name: "updateCollectionCap",
                description: "Set maximum collection size (0-10000)",
                castScript: "cast send $CONTRACT_ADDRESS 'updateCollectionCap(uint256)' 5000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["newCap: uint256"]
              },
              {
                name: "updateWalletLimit",
                description: "Set NFTs per wallet limit",
                castScript: "cast send $CONTRACT_ADDRESS 'updateWalletLimit(uint256)' 7 --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["newLimit: uint256"]
              }
            ]}
          />

          {/* Pricing Management */}
          <AdminSection
            icon={<DollarSign className="w-6 h-6" />}
            title="Pricing Management"
            description="Configure mint costs and service fees"
            functions={[
              {
                name: "updateMintPricing",
                description: "Set all mint pricing tiers [base: 0.001 ETH, +0.001 ETH per line]",
                castScript: "cast send $CONTRACT_ADDRESS 'updateMintPricing(uint256[6])' '[1000000000000000,1000000000000000,2000000000000000,3000000000000000,4000000000000000,5000000000000000]' --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["prices: uint256[6] - [1000000000000000 (0.001 ETH), 1000000000000000 (0.001 ETH), 2000000000000000 (0.002 ETH), 3000000000000000 (0.003 ETH), 4000000000000000 (0.004 ETH), 5000000000000000 (0.005 ETH)]"]
              },
              {
                name: "updateServicePricing",
                description: "Set maintenance service costs [clean: 0.001 ETH, restore: 0.001 ETH, master: 0.002 ETH, threshold: 0.005 ETH]",
                castScript: "cast send $CONTRACT_ADDRESS 'updateServicePricing(uint256[4])' '[1000000000000000,1000000000000000,2000000000000000,5000000000000000]' --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["prices: uint256[4] - [1000000000000000 (0.001 ETH), 1000000000000000 (0.001 ETH), 2000000000000000 (0.002 ETH), 5000000000000000 (0.005 ETH)]"]
              }
            ]}
          />

          {/* Aging Configuration */}
          <AdminSection
            icon={<Clock className="w-6 h-6" />}
            title="Aging Configuration"
            description="Control dirt accumulation and texture aging parameters"
            functions={[
              {
                name: "updateAgingThresholds",
                description: "Set aging time thresholds in days [dirt1, dirt2, texture1, texture2, freeClean, freeWindow]",
                castScript: "cast send $CONTRACT_ADDRESS 'updateAgingThresholds(uint256[6])' '[3,7,30,180,30,11]' --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["thresholds: uint256[6] - [dirtLevel1Days, dirtLevel2Days, textureLevel1Days, textureLevel2Days, freeCleanDays, freeCleanWindow]"]
              }
            ]}
          />

          {/* Exception Management */}
          <AdminSection
            icon={<Users className="w-6 h-6" />}
            title="Exception Management"
            description="Manage addresses exempt from wallet limits"
            functions={[
              {
                name: "addToExceptionList",
                description: "Add address to wallet limit exception list",
                castScript: "cast send $CONTRACT_ADDRESS 'addToExceptionList(address)' 0x1234567890123456789012345678901234567890 --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["account: address"]
              },
              {
                name: "removeFromExceptionList",
                description: "Remove address from wallet limit exception list",
                castScript: "cast send $CONTRACT_ADDRESS 'removeFromExceptionList(address)' 0x1234567890123456789012345678901234567890 --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["account: address"]
              }
            ]}
          />

          {/* Feature Toggles */}
          <AdminSection
            icon={<Code className="w-6 h-6" />}
            title="Feature Controls"
            description="Enable/disable major functionality"
            functions={[
              {
                name: "setLaunderingEnabled",
                description: "Toggle auto-cleaning on high-value sales",
                castScript: "cast send $CONTRACT_ADDRESS 'setLaunderingEnabled(bool)' true --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["enabled: bool"]
              },
              {
                name: "setLaunchStatus",
                description: "Set official launch status",
                castScript: "cast send $CONTRACT_ADDRESS 'setLaunchStatus(bool)' true --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["launched: bool"]
              },
              {
                name: "setScriptyContracts",
                description: "Configure Scripty contract addresses for HTML generation",
                castScript: "cast send $CONTRACT_ADDRESS 'setScriptyContracts(address,address,address)' 0xBuilderAddress 0xStorageAddress 0xGeneratorAddress --private-key $PRIVATE_KEY --rpc-url $RPC_URL",
                params: ["rugScriptyBuilder: address", "rugEthFSStorage: address", "onchainRugsHTMLGenerator: address"]
              }
            ]}
          />
        </div>

        {/* ETH to Wei Converter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <EthWeiConverter />
        </motion.div>

        {/* Environment Variables Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <LiquidGlass
            blurAmount={0.1}
            aberrationIntensity={2}
            elasticity={0.05}
            cornerRadius={12}
            className="p-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Environment Variables Required</h3>
              <div className="text-white/80 space-y-2 text-left">
                <p><strong>$CONTRACT_ADDRESS:</strong> Your deployed OnchainRugs diamond contract address</p>
                <p><strong>$PRIVATE_KEY:</strong> Private key of the contract owner</p>
                <p><strong>$RPC_URL:</strong> RPC endpoint URL for the target network</p>
              </div>
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <p className="text-white/60 text-sm">
                  ⚠️ Never commit private keys to version control. Use environment variables or secure key management.
                </p>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </div>
    </div>
  )
}

function AdminSection({
  icon,
  title,
  description,
  functions
}: {
  icon: React.ReactNode
  title: string
  description: string
  functions: Array<{
    name: string
    description: string
    castScript: string
    params: string[]
  }>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlass
        blurAmount={0.1}
        aberrationIntensity={3}
        elasticity={0.1}
        cornerRadius={16}
        className="p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-blue-400">{icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-white/70">{description}</p>
          </div>
        </div>

        <div className="space-y-4">
          {functions.map((func, index) => (
            <FunctionCard key={index} {...func} />
          ))}
        </div>
      </LiquidGlass>
    </motion.div>
  )
}

function FunctionCard({
  name,
  description,
  castScript,
  params
}: {
  name: string
  description: string
  castScript: string
  params: string[]
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(castScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="text-white/70 text-sm">{description}</p>
        </div>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md text-sm transition-colors duration-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {params.length > 0 && (
        <div className="mb-3">
          <p className="text-white/60 text-sm mb-1">Parameters:</p>
          <ul className="text-white/80 text-sm space-y-1">
            {params.map((param, index) => (
              <li key={index} className="font-mono">• {param}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-black/30 rounded-md p-3">
        <code className="text-green-400 text-sm font-mono break-all">
          {castScript}
        </code>
      </div>
    </div>
  )
}

function EthWeiConverter() {
  const [ethValue, setEthValue] = useState<string>('')
  const [weiValue, setWeiValue] = useState<string>('')
  const [direction, setDirection] = useState<'eth-to-wei' | 'wei-to-eth'>('eth-to-wei')

  // Common ETH values for quick reference
  const commonValues = [
    { eth: '0.00001', wei: '10000000000000', description: 'Test mint price' },
    { eth: '0.0001', wei: '100000000000000', description: 'Small transaction' },
    { eth: '0.001', wei: '1000000000000000', description: '0.1% of 1 ETH' },
    { eth: '0.01', wei: '10000000000000000', description: '1% of 1 ETH' },
    { eth: '0.1', wei: '100000000000000000', description: '10% of 1 ETH' },
    { eth: '1', wei: '1000000000000000000', description: '1 ETH' },
  ]

  const convertEthToWei = (eth: string): string => {
    if (!eth || isNaN(Number(eth))) return ''
    try {
      const wei = (BigInt(Math.floor(Number(eth) * 1e18))).toString()
      return wei
    } catch {
      return ''
    }
  }

  const convertWeiToEth = (wei: string): string => {
    if (!wei || isNaN(Number(wei))) return ''
    try {
      const eth = (Number(wei) / 1e18).toString()
      return eth
    } catch {
      return ''
    }
  }

  const handleEthChange = (value: string) => {
    setEthValue(value)
    if (direction === 'eth-to-wei') {
      setWeiValue(convertEthToWei(value))
    }
  }

  const handleWeiChange = (value: string) => {
    setWeiValue(value)
    if (direction === 'wei-to-eth') {
      setEthValue(convertWeiToEth(value))
    }
  }

  const switchDirection = () => {
    setDirection(prev => prev === 'eth-to-wei' ? 'wei-to-eth' : 'eth-to-wei')
    // Swap values
    const temp = ethValue
    setEthValue(weiValue)
    setWeiValue(temp)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const quickSelect = (eth: string, wei: string) => {
    setEthValue(eth)
    setWeiValue(wei)
  }

  return (
    <LiquidGlass
      blurAmount={0.1}
      aberrationIntensity={2}
      elasticity={0.05}
      cornerRadius={12}
      className="p-6"
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-blue-400" />
          <h3 className="text-2xl font-bold text-white">ETH ↔ Wei Converter</h3>
        </div>
        <p className="text-white/70">Convert between ETH and Wei for easy pricing configuration</p>
      </div>

      {/* Converter Interface */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* ETH Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">ETH</label>
          <input
            type="text"
            value={ethValue}
            onChange={(e) => handleEthChange(e.target.value)}
            placeholder="Enter ETH amount (e.g., 0.001)"
            className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Switch Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={switchDirection}
            className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-full transition-colors duration-200"
            title="Switch conversion direction"
          >
            <ArrowUpDown className="w-6 h-6 text-blue-400" />
          </button>
        </div>

        {/* Wei Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Wei</label>
          <input
            type="text"
            value={weiValue}
            onChange={(e) => handleWeiChange(e.target.value)}
            placeholder="Wei amount (18 decimals)"
            className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>
      </div>

      {/* Quick Reference Values */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Quick Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commonValues.map((value, index) => (
            <button
              key={index}
              onClick={() => quickSelect(value.eth, value.wei)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200 text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{value.eth} ETH</div>
                  <div className="text-white/60 text-sm font-mono">{value.wei}</div>
                </div>
                <div className="text-white/40 text-xs">{value.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Copy Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => copyToClipboard(weiValue)}
          disabled={!weiValue}
          className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-300 rounded-lg transition-colors duration-200"
        >
          Copy Wei Value
        </button>
        <button
          onClick={() => copyToClipboard(`[${weiValue}]`)}
          disabled={!weiValue}
          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-green-300 rounded-lg transition-colors duration-200"
        >
          Copy as Array
        </button>
      </div>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <h5 className="text-white font-medium mb-2">💡 Usage Tips</h5>
        <ul className="text-white/70 text-sm space-y-1">
          <li>• For pricing arrays like <code className="bg-black/30 px-1 rounded">updateMintPricing</code>, use the &quot;Copy as Array&quot; button</li>
          <li>• Wei values are always 18 decimal places (1 ETH = 10<sup>18</sup> wei)</li>
          <li>• Test values are typically 0.00001-0.0001 ETH for development</li>
          <li>• Production values might be 0.001-0.01 ETH or higher</li>
        </ul>
      </div>
    </LiquidGlass>
  )
}
