'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Tag, ShoppingCart, X, TrendingUp, Clock } from 'lucide-react'
import LiquidGlass from '../LiquidGlass'
import { formatEth, formatTimeAgo } from '@/utils/marketplace-utils'
import { useMarketplaceActivity } from '@/hooks/use-marketplace-data'

interface ActivityFeedProps {
  limit?: number
  autoRefresh?: boolean
  className?: string
}

type ActivityType = 'listing' | 'sale' | 'cancelled'

interface Activity {
  id: string
  type: ActivityType
  tokenId: number
  price?: bigint
  from?: string
  to?: string
  timestamp: number
}

export default function ActivityFeed({ limit = 20, autoRefresh = true, className = '' }: ActivityFeedProps) {
  const { activities, isLoading } = useMarketplaceActivity(limit)

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4" />
      case 'listing':
        return <Tag className="w-4 h-4" />
      case 'cancelled':
        return <X className="w-4 h-4" />
      default:
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'sale':
        return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'listing':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'cancelled':
        return 'text-red-400 bg-red-500/10 border-red-500/30'
      default:
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  }

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case 'sale':
        return `Sold Rug #${activity.tokenId} for ${formatEth(activity.price || BigInt(0))} ETH`
      case 'listing':
        return `Listed Rug #${activity.tokenId} for ${formatEth(activity.price || BigInt(0))} ETH`
      case 'cancelled':
        return `Cancelled listing for Rug #${activity.tokenId}`
      default:
        return `Activity on Rug #${activity.tokenId}`
    }
  }

  return (
    <div className={className}>
      <LiquidGlass
        blurAmount={0.1}
        aberrationIntensity={1}
        elasticity={0.05}
        cornerRadius={12}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Recent Activity
            </h3>
            {autoRefresh && (
              <div className="flex items-center gap-1 text-xs text-white/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="text-center text-white/50 py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                  <p>Loading activity...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center text-white/50 py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                activities.map((activity: Activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                  >
                    <div className={`p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 ${getActivityColor(activity.type)}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">
                            {getActivityDescription(activity)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-white/60">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                            {activity.from && (
                              <span className="text-xs text-white/40">
                                by {activity.from.slice(0, 6)}...{activity.from.slice(-4)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}