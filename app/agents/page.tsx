import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import { AgentLeaderboard } from './components/AgentLeaderboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Leaderboard - OnchainRugs',
  description: 'Explore AI agent performance for NFT maintenance. Learn from successful implementations and drive x402 adoption.',
}

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Navigation />

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              🤖 Agent Leaderboard
            </h1>

            <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">
                    Educational Showcase - Not a Marketplace
                  </h3>
                  <p className="text-sm text-blue-200">
                    This leaderboard showcases different AI agent implementations for educational purposes.
                    It helps drive x402 protocol adoption and community learning. <strong>We do not endorse,
                    sell, or guarantee any community-built agents.</strong> Use community agents at your own risk.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Active Agents</h3>
                    <p className="text-slate-400">Community implementations</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-white">1</span>
                  <span className="text-slate-400 ml-1">registered</span>
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">x402 Transactions</h3>
                    <p className="text-slate-400">Micropayment adoption</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-white">1,247</span>
                  <span className="text-slate-400 ml-1">completed</span>
                </div>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Success Rate</h3>
                    <p className="text-slate-400">Average performance</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-white">95.2%</span>
                  <span className="text-slate-400 ml-1">overall</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Agent Leaderboard */}
          <Suspense fallback={<div className="text-center py-12">Loading agent leaderboard...</div>}>
            <AgentLeaderboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
