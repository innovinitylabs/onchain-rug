'use client'

import { TrendingUp, DollarSign, ShoppingBag, Activity } from 'lucide-react'
import LiquidGlass from '../LiquidGlass'
import { useMarketplaceStats } from '@/hooks/use-marketplace-data'
import { formatEth, formatNumber } from '@/utils/marketplace-utils'

interface MarketplaceStatsProps {
  className?: string
  variant?: 'full' | 'compact'
}

export default function MarketplaceStats({ className = '', variant = 'full' }: MarketplaceStatsProps) {
  const { stats, isLoading } = useMarketplaceStats()

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
        <StatCard
          label="Total Volume"
          value={isLoading ? '...' : stats ? `${formatEth(stats.totalVolume)} ETH` : '0'}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Total Sales"
          value={isLoading ? '...' : stats ? formatNumber(Number(stats.totalSales)) : '0'}
          icon={<ShoppingBag className="w-4 h-4" />}
          color="purple"
        />
        <StatCard
          label="Fees Collected"
          value={isLoading ? '...' : stats ? `${formatEth(stats.totalFeesCollected)} ETH` : '0'}
          icon={<DollarSign className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Market Fee"
          value={isLoading ? '...' : stats ? `${(Number(stats.marketplaceFeeBPS) / 100).toFixed(1)}%` : '2.5%'}
          icon={<Activity className="w-4 h-4" />}
          color="yellow"
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <LiquidGlass
        blurAmount={0.12}
        aberrationIntensity={1.5}
        elasticity={0.08}
        cornerRadius={16}
      >
        <div className="p-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Marketplace Stats
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Volume */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Volume</span>
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {stats ? formatEth(stats.totalVolume) : '0'}
                </div>
              )}
              <div className="text-xs text-white/50">ETH</div>
            </div>

            {/* Total Sales */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-400">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Sales</span>
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {stats ? formatNumber(Number(stats.totalSales)) : '0'}
                </div>
              )}
              <div className="text-xs text-white/50">Transactions</div>
            </div>

            {/* Fees Collected */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Fees Collected</span>
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {stats ? formatEth(stats.totalFeesCollected) : '0'}
                </div>
              )}
              <div className="text-xs text-white/50">ETH</div>
            </div>

            {/* Marketplace Fee */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-yellow-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Market Fee</span>
              </div>
              {isLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {stats ? (Number(stats.marketplaceFeeBPS) / 100).toFixed(1) : '2.5'}%
                </div>
              )}
              <div className="text-xs text-white/50">Per Sale</div>
            </div>
          </div>

          {/* Additional Stats Row */}
          {!isLoading && stats && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Avg Sale Price:</span>
                <span className="text-white font-mono">
                  {stats.totalSales > 0
                    ? formatEth(stats.totalVolume / BigInt(Number(stats.totalSales)))
                    : '0'
                  } ETH
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Fee Rate:</span>
                <span className="text-white font-mono">{stats ? (Number(stats.marketplaceFeeBPS) / 100).toFixed(1) : '2.5'}%</span>
              </div>
            </div>
          )}
        </div>
      </LiquidGlass>
    </div>
  )
}

// Compact stat card component
function StatCard({
  label,
  value,
  icon,
  color
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'emerald' | 'blue' | 'purple' | 'yellow'
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  }

  return (
    <LiquidGlass
      blurAmount={0.08}
      aberrationIntensity={1}
      elasticity={0.05}
      cornerRadius={12}
    >
      <div className="p-4">
        <div className={`flex items-center gap-2 mb-2 ${colorClasses[color]}`}>
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-xl font-bold text-white">{value}</div>
      </div>
    </LiquidGlass>
  )
}
