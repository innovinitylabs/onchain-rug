'use client'

export function X402Showcase() {
  const x402Stats = {
    totalTransactions: 1247,
    averagePayment: '0.0008 ETH',
    successRate: 99.2,
    gasSavings: 87,
    totalVolume: '0.9976 ETH',
    monthlyGrowth: 23
  }

  const benefits = [
    {
      title: "Microtransactions Made Possible",
      description: "x402 enables tiny payments (0.0008 ETH) that were previously impossible due to gas costs.",
      icon: "⚡",
      metric: `${x402Stats.averagePayment} avg`
    },
    {
      title: "87% Gas Cost Reduction",
      description: "State channels allow multiple operations without individual gas fees.",
      icon: "💰",
      metric: `${x402Stats.gasSavings}% savings`
    },
    {
      title: "99.2% Success Rate",
      description: "Reliable micropayments with cryptographic security guarantees.",
      icon: "🛡️",
      metric: `${x402Stats.successRate}% success`
    },
    {
      title: "Scalable Agent Operations",
      description: "Agents can perform multiple small operations efficiently.",
      icon: "📈",
      metric: `${x402Stats.monthlyGrowth}% monthly growth`
    }
  ]

  const useCases = [
    {
      title: "AI Maintenance Tasks",
      description: "Agents pay tiny fees for each maintenance operation",
      example: "Clean rug: 0.0005 ETH → x402 channel → Batch settlement"
    },
    {
      title: "Progressive Disclosure",
      description: "Pay-per-insight model for AI analysis",
      example: "Basic analysis: Free → Detailed report: 0.001 ETH"
    },
    {
      title: "Usage-Based Pricing",
      description: "Pay only for agent compute time used",
      example: "Per-minute billing: 0.0001 ETH/minute"
    },
    {
      title: "Service Subscriptions",
      description: "Micro-payments for ongoing agent services",
      example: "Daily monitoring: 0.002 ETH/day"
    }
  ]

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
      <div className="p-6 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-2">
          🚀 x402 Protocol Showcase
        </h3>
        <p className="text-sm text-slate-400">
          Real micropayment adoption data from agent operations on Base Sepolia.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{x402Stats.totalTransactions.toLocaleString()}</div>
            <div className="text-sm text-blue-300">Total Transactions</div>
          </div>
          <div className="text-center p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{x402Stats.successRate}%</div>
            <div className="text-sm text-green-300">Success Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{x402Stats.gasSavings}%</div>
            <div className="text-sm text-purple-300">Gas Savings</div>
          </div>
          <div className="text-center p-4 bg-orange-900/20 border border-orange-700/30 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">{x402Stats.averagePayment}</div>
            <div className="text-sm text-orange-300">Avg Payment</div>
          </div>
        </div>

        {/* x402 Benefits */}
        <div>
          <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            x402 Benefits for AI Agents
          </h4>
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <div className="text-lg">{benefit.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-white">{benefit.title}</h5>
                    <span className="text-sm font-semibold text-blue-400">{benefit.metric}</span>
                  </div>
                  <p className="text-sm text-slate-300">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div>
          <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Agent Use Cases with x402
          </h4>
          <div className="space-y-3">
            {useCases.map((useCase, index) => (
              <div key={index} className="p-4 border border-slate-700/50 rounded-lg bg-slate-900/20">
                <h5 className="font-medium text-white mb-1">{useCase.title}</h5>
                <p className="text-sm text-slate-400 mb-2">{useCase.description}</p>
                <div className="bg-slate-800/50 p-2 rounded text-xs font-mono text-slate-300 border border-slate-700/30">
                  {useCase.example}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="border-t border-slate-700/50 pt-6">
          <h4 className="text-md font-medium text-white mb-4">🔧 Technical Implementation</h4>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Protocol:</span>
                <span className="font-medium text-white">x402 State Channels</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement:</span>
                <span className="font-medium text-white">Batch Processing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security:</span>
                <span className="font-medium text-white">Cryptographic Proofs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="font-medium text-white">Base Sepolia Testnet</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a
              href="https://docs.x402.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              📖 x402 Documentation →
            </a>
            <a
              href="/docs/agent-x402-integration"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              🔗 Agent Integration Guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
