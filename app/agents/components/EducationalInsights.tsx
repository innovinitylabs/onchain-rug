'use client'

export function EducationalInsights() {
  const insights = [
    {
      title: "AI Analysis First",
      description: "Top-performing agents analyze NFT metadata before taking action, achieving 95%+ success rates.",
      icon: "🧠",
      percentage: "95%"
    },
    {
      title: "Cost Optimization",
      description: "Successful agents estimate costs upfront and optimize gas usage, reducing average transaction costs by 40%.",
      icon: "💰",
      percentage: "40%"
    },
    {
      title: "Error Handling",
      description: "Agents with robust error handling and retry logic maintain 99%+ uptime.",
      icon: "🛡️",
      percentage: "99%"
    },
    {
      title: "User Confirmation",
      description: "Agents that seek user confirmation before expensive operations have higher user satisfaction.",
      icon: "✅",
      percentage: "4.8★"
    }
  ]

  const commonPitfalls = [
    {
      issue: "Insufficient Gas Estimation",
      solution: "Always estimate gas costs before transactions to avoid failed operations.",
      impact: "Causes 23% of agent failures"
    },
    {
      issue: "Wrong Contract Calls",
      solution: "Validate contract addresses and function signatures before calling.",
      impact: "Causes 18% of agent failures"
    },
    {
      issue: "Timing Issues",
      solution: "Handle blockchain delays and transaction confirmations properly.",
      impact: "Causes 15% of agent failures"
    },
    {
      issue: "State Inconsistency",
      solution: "Always check current blockchain state before making decisions.",
      impact: "Causes 12% of agent failures"
    }
  ]

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
      <div className="p-6 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-2">
          📚 Educational Insights
        </h3>
        <p className="text-sm text-slate-400">
          Learn from successful agent implementations and avoid common pitfalls.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Best Practices */}
        <div>
          <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Best Practices from Top Agents
          </h4>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <div className="text-lg">{insight.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-white">{insight.title}</h5>
                    <span className="text-sm font-semibold text-green-400">{insight.percentage}</span>
                  </div>
                  <p className="text-sm text-slate-300">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Pitfalls */}
        <div>
          <h4 className="text-md font-medium text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Common Pitfalls to Avoid
          </h4>
          <div className="space-y-3">
            {commonPitfalls.map((pitfall, index) => (
              <div key={index} className="p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-white">{pitfall.issue}</h5>
                  <span className="text-xs font-medium text-red-400 bg-red-900/40 px-2 py-1 rounded border border-red-700/30">
                    {pitfall.impact}
                  </span>
                </div>
                <p className="text-sm text-red-200">{pitfall.solution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Resources */}
        <div className="border-t border-slate-700/50 pt-6">
          <h4 className="text-md font-medium text-white mb-4">📖 Learning Resources</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://docs.onchainrugs.xyz/agent-api"
              className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg hover:bg-blue-900/30 transition-colors"
            >
              <div className="text-blue-400">📚</div>
              <div>
                <div className="font-medium text-blue-200">Agent API Docs</div>
                <div className="text-sm text-blue-300">Complete API reference</div>
              </div>
            </a>
            <a
              href="https://github.com/innovinitylabs/onchain-rug/tree/main/standalone-ai-agent"
              className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg hover:bg-purple-900/30 transition-colors"
            >
              <div className="text-purple-400">💻</div>
              <div>
                <div className="font-medium text-purple-200">Source Code</div>
                <div className="text-sm text-purple-300">Fork and modify</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
