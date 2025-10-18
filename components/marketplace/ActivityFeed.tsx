'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Gavel, DollarSign, TrendingUp, Clock, ExternalLink } from 'lucide-react'
import LiquidGlass from '../LiquidGlass'
import { useActivityFeed } from '@/hooks/use-marketplace-data'
import { formatEth, formatDate } from '@/utils/marketplace-utils'

interface ActivityFeedProps {
  limit?: number
  autoRefresh?: boolean
  className?: string
}

type ActivityType = 'sale' | 'listing' | 'auction_created' | 'bid' | 'offer' | 'offer_accepted'

interface Activity {
  id: string
  type: ActivityType
  tokenId: number
  price?: bigint | string
  from?: string
  to?: string
  timestamp: number
  txHash?: string
}

export default function ActivityFeed({ limit = 20, autoRefresh = true, className = '' }: ActivityFeedProps) {
  const { activities, isLoading } = useActivityFeed(limit)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to top when new activities arrive
  useEffect(() => {
    if (containerRef.current && activities.length > 0) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activities.length])

  if (isLoading && activities.length === 0) {
    return (
      <div className={className}>
        <LiquidGlass blurAmount={0.1} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
          <div className="p-4">
            <h3 className="text-white font-semibold mb-4">Activity Feed</h3>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          </div>
        </LiquidGlass>
      </div>
    )
  }

  return (
    <div className={className}>
      <LiquidGlass blurAmount={0.1} aberrationIntensity={1} elasticity={0.05} cornerRadius={12}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Activity Feed</h3>
            {autoRefresh && (
              <div className="flex items-center gap-1 text-xs text-white/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
          
          <div 
            ref={containerRef}
            className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            <AnimatePresence mode="popLayout">
              {activities.length === 0 ? (
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
                    <ActivityItem activity={activity} />
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

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity.type)
  const color = getActivityColor(activity.type)
  const description = getActivityDescription(activity)

  return (
    <div className={`p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 ${color.border}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded ${color.bg} flex-shrink-0`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-white text-sm leading-tight">{description}</p>
            {activity.price && (
              <span className={`text-sm font-semibold ${color.text} flex-shrink-0`}>
                {typeof activity.price === 'string' ? activity.price : formatEth(activity.price)} ETH
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>Rug #{activity.tokenId}</span>
            <span>•</span>
            <span>{formatTimeAgo(activity.timestamp)}</span>
            {activity.txHash && (
              <>
                <span>•</span>
                <a
                  href={`https://etherscan.io/tx/${activity.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-white/10 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'sale':
      return <TrendingUp className="w-4 h-4 text-green-300" />
    case 'listing':
      return <Tag className="w-4 h-4 text-blue-300" />
    case 'auction_created':
      return <Gavel className="w-4 h-4 text-purple-300" />
    case 'bid':
      return <DollarSign className="w-4 h-4 text-yellow-300" />
    case 'offer':
      return <DollarSign className="w-4 h-4 text-blue-300" />
    case 'offer_accepted':
      return <TrendingUp className="w-4 h-4 text-emerald-300" />
    default:
      return <Clock className="w-4 h-4 text-white/50" />
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case 'sale':
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-300',
        border: 'border-green-500/30'
      }
    case 'listing':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30'
      }
    case 'auction_created':
      return {
        bg: 'bg-purple-500/20',
        text: 'text-purple-300',
        border: 'border-purple-500/30'
      }
    case 'bid':
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-300',
        border: 'border-yellow-500/30'
      }
    case 'offer':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-500/30'
      }
    case 'offer_accepted':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30'
      }
    default:
      return {
        bg: 'bg-white/10',
        text: 'text-white/60',
        border: 'border-white/20'
      }
  }
}

function getActivityDescription(activity: Activity): string {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  switch (activity.type) {
    case 'sale':
      return `Sold by ${activity.from ? formatAddress(activity.from) : 'unknown'} to ${activity.to ? formatAddress(activity.to) : 'unknown'}`
    case 'listing':
      return `Listed by ${activity.from ? formatAddress(activity.from) : 'unknown'}`
    case 'auction_created':
      return `Auction started by ${activity.from ? formatAddress(activity.from) : 'unknown'}`
    case 'bid':
      return `Bid placed by ${activity.from ? formatAddress(activity.from) : 'unknown'}`
    case 'offer':
      return `Offer made by ${activity.from ? formatAddress(activity.from) : 'unknown'}`
    case 'offer_accepted':
      return `Offer accepted from ${activity.from ? formatAddress(activity.from) : 'unknown'}`
    default:
      return 'Activity'
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(timestamp)
}

/**
 * Compact version of activity feed for use in smaller spaces
 */
export function ActivityFeedCompact({ limit = 5 }: { limit?: number }) {
  const { activities, isLoading } = useActivityFeed(limit)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activities.slice(0, limit).map((activity: Activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1 rounded ${getActivityColor(activity.type).bg}`}>
              {getActivityIcon(activity.type)}
            </div>
            <span className="text-xs text-white/70 truncate">
              #{activity.tokenId}
            </span>
          </div>
          {activity.price && (
            <span className="text-xs text-white font-mono">
              {typeof activity.price === 'string' ? activity.price : formatEth(activity.price)} Ξ
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

