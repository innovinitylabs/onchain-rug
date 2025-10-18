'use client'

import { TrendingUp, DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'
import LiquidGlass from '../LiquidGlass'
import { useMarketplaceStats, useFloorPrice } from '@/hooks/use-marketplace-data'
import { formatEth, formatNumber } from '@/utils/marketplace-utils'

interface MarketplaceStatsProps {
  className?: string
  variant?: 'full' | 'compact'
}

export default function MarketplaceStats({ className = '', variant = 'full' }: MarketplaceStatsProps) {
  const { stats, isLoading: statsLoading } = useMarketplaceStats()
  const { floorPrice, isLoading: floorLoading } = useFloorPrice()

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
        <StatCard
          label="Floor Price"
          value={floorLoading ? '...' : floorPrice ? `${formatEth(floorPrice)} ETH` : 'N/A'}
          icon={<DollarSign className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Total Volume"
          value={statsLoading ? '...' : stats ? `${formatEth(stats.totalVolume)} ETH` : '0'}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Total Sales"
          value={statsLoading ? '...' : stats ? formatNumber(stats.totalSales) : '0'}
          icon={<ShoppingBag className="w-4 h-4" />}
          color="purple"
        />
        <StatCard
          label="Market Fee"
          value={statsLoading ? '...' : stats ? `${(stats.marketplaceFeePercent / 100).toFixed(1)}%` : '2.5%'}
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
            {/* Floor Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Floor Price</span>
              </div>
              {floorLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {floorPrice ? `${formatEth(floorPrice)}` : 'N/A'}
                </div>
              )}
              <div className="text-xs text-white/50">ETH</div>
            </div>

            {/* Total Volume */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Volume</span>
              </div>
              {statsLoading ? (
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
              {statsLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {stats ? formatNumber(stats.totalSales) : '0'}
                </div>
              )}
              <div className="text-xs text-white/50">Transactions</div>
            </div>

            {/* Marketplace Fee */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-yellow-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Market Fee</span>
              </div>
              {statsLoading ? (
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {stats ? (stats.marketplaceFeePercent / 100).toFixed(1) : '2.5'}%
                </div>
              )}
              <div className="text-xs text-white/50">Per Sale</div>
            </div>
          </div>

          {/* Additional Stats Row */}
          {!statsLoading && stats && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Fees Collected:</span>
                <span className="text-white font-mono">{formatEth(stats.totalFeesCollected)} ETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Avg Sale Price:</span>
                <span className="text-white font-mono">
                  {stats.totalSales > 0 
                    ? formatEth(stats.totalVolume / BigInt(stats.totalSales))
                    : '0'
                  } ETH
                </span>
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

/**
 * Simple inline stats for use in headers/banners
 */
export function InlineMarketplaceStats() {
  const { stats } = useMarketplaceStats()
  const { floorPrice } = useFloorPrice()

  return (
    <div className="flex items-center gap-6 text-sm">
      {floorPrice && (
        <div className="flex items-center gap-2">
          <span className="text-white/50">Floor:</span>
          <span className="text-emerald-400 font-mono">{formatEth(floorPrice)} ETH</span>
        </div>
      )}
      {stats && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-white/50">Volume:</span>
            <span className="text-blue-400 font-mono">{formatEth(stats.totalVolume)} ETH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50">Sales:</span>
            <span className="text-purple-400 font-mono">{formatNumber(stats.totalSales)}</span>
          </div>
        </>
      )}
    </div>
  )
}

