'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Palette, Target, Gamepad2, Cpu, Zap, Clock, Users, Gem, Star, HelpCircle } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface WhitePaperModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WhitePaperModal({ isOpen, onClose }: WhitePaperModalProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'rarity' | 'optional' | 'consequence' | 'journey' | 'pricing' | 'royalties' | 'aging' | 'frames' | 'pool' | 'agents' | 'ownership' | 'standards' | 'result'>('overview')


  if (!isOpen) return null

  const sections = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'rarity', label: 'User-Chosen Rarity', icon: Palette },
    { id: 'optional', label: 'Optional Maintenance', icon: Gamepad2 },
    { id: 'consequence', label: 'Consequence, Not Rent', icon: Clock },
    { id: 'journey', label: 'User Journey', icon: Users },
    { id: 'pricing', label: 'Pricing Structure', icon: Zap },
    { id: 'royalties', label: 'Royalties & Attribution', icon: Gem },
    { id: 'aging', label: 'Aging Mechanics', icon: Clock },
    { id: 'frames', label: 'Frame System', icon: Star },
    { id: 'pool', label: 'Diamond Frame Pool', icon: Gem },
    { id: 'agents', label: 'Agentic Maintenance', icon: Cpu },
    { id: 'ownership', label: 'Ownership & Metadata', icon: FileText },
    { id: 'standards', label: 'Standards', icon: Zap },
    { id: 'result', label: 'Final Result', icon: HelpCircle }
  ] as const

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">OnchainRugs</h2>
              <p className="text-white/80">Fully on-chain generative artwork that ages if neglected and improves if cared for.</p>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg p-6 mb-6">
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                <strong>OnchainRugs is a fully on-chain artwork that ages if neglected and improves if cared for. Ownership comes with visible responsibility. Over time, rugs can earn frames that slow decay and turn them into gallery-grade artifacts.</strong>
              </p>
              <p className="text-white/90 text-lg leading-relaxed">
                <strong>It is satire about rug pulls, but it is really about stewardship, time, and consequences.</strong>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/90 text-lg leading-relaxed">
                <strong>Each rug is complete at mint.</strong>
              </p>
            </div>
          </div>
        )

      case 'rarity':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Palette className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">User-Chosen and Post-Mint Rebalanced Rarity</h2>
              <p className="text-white/80">Rarity system driven by user choice and post-mint outcomes, not fixed randomness.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <p className="text-white/90 leading-relaxed">
                OnchainRugs use a rarity system driven by <strong>user choice and post-mint outcomes</strong>, not fixed randomness.
                </p>
              </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Mint-Time Characteristics</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• The generator provides <strong>102 predefined color palettes</strong>, each with an internal rarity weight.</li>
                  <li>• Pattern structure, band count, and composition further contribute to intrinsic rarity.</li>
                  <li>• Users may generate <strong>unlimited variations</strong> and mint only the rug they prefer.</li>
                  <li>• Frontend rarity labels such as Common, Uncommon, Epic, etc. reflect <strong>designed rarity weights</strong>, not enforced scarcity.</li>
                </ul>
                <p className="text-white/80 mt-4">At this stage, rarity is <strong>suggested</strong>, not finalized.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Post-Mint Rarity Rebalancing</h3>
                <p className="text-white/80 mb-4">
                  Once the collection reaches its <strong>10,000 mint cap</strong>, rarity rebalances based on <strong>actual mint behavior</strong>.
                </p>
                <ul className="text-white/80 space-y-2">
                  <li>• Rarity is determined by <strong>what was minted</strong>, not what was possible.</li>
                  <li>• A theoretically rare palette becomes common if widely chosen.</li>
                  <li>• A common palette becomes rare if consistently avoided.</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Emergent Long-Term Rarity</h3>
                <p className="text-white/80 mb-4">After mint, additional rarity emerges organically through:</p>
                <ul className="text-white/80 space-y-2">
                  <li>• Aging paths</li>
                  <li>• Maintenance or neglect</li>
                  <li>• Laundering events</li>
                  <li>• Frame progression</li>
                  <li>• Recorded ownership and maintenance history</li>
                </ul>
                <p className="text-white/90 mt-4">
                  <strong>No single rarity table remains authoritative.</strong>
                </p>
                <p className="text-white/90 mt-2">
                  <strong>Long-term rarity is allowed to form through user preference, behavior, neglect, taste, and time.</strong>
                </p>
              </div>
            </div>
          </div>
        )

      case 'optional':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Gamepad2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Maintenance Is Optional, Not Required</h2>
              <p className="text-white/80">Complete artworks at mint - maintenance influences evolution, not ownership</p>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-6 mb-6">
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                <strong>OnchainRugs are complete artworks at mint.</strong>
              </p>
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                <strong>Maintenance does not preserve ownership or baseline value.</strong>
              </p>
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                <strong>It only influences how the artwork ages, accrues history, and earns frames.</strong>
              </p>
              <p className="text-white/90 text-lg leading-relaxed">
                <strong>Neglect is a valid path and results in a different visual and historical outcome.</strong>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/90 leading-relaxed">
                There is <strong>no forced interaction</strong>, <strong>no required upkeep</strong>, <strong>no penalty beyond visual and historical evolution</strong>.
              </p>
            </div>
          </div>
        )

      case 'consequence':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Clock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Maintenance Fees Represent Consequence, Not Rent</h2>
              <p className="text-white/80">Reversing time carries a cost - preservation of aging integrity</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <p className="text-white/90 leading-relaxed mb-4">
                <strong>OnchainRugs do not charge for routine care.</strong>
              </p>
              <p className="text-white/90 leading-relaxed">
                <strong>Cleaning is intentionally free for extended periods and can be performed indefinitely through periodic attention.</strong>
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">Why Fees Exist</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>Restoration</strong> and <strong>Master Restoration</strong> reverse the effects of time.</li>
                  <li>• Reversing time is allowed.</li>
                  <li>• Reversing time is <strong>never free</strong>.</li>
                </ul>
                <p className="text-white/80 mt-4">
                  Fees introduce friction so that recovery remains possible <strong>without trivializing neglect</strong>.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">What Fees Are Not</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• Maintenance fees are <strong>not</strong> a revenue stream.</li>
                  <li>• They are <strong>not</strong> rent.</li>
                  <li>• They are <strong>not</strong> required to preserve baseline value.</li>
                    </ul>
                <p className="text-white/80 mt-4">
                  They exist as a <strong>consequence mechanism</strong> that preserves aging integrity, historical continuity, and rarity credibility.
                </p>
            </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-lg p-6">
                <p className="text-white/90 text-lg leading-relaxed">
                  <strong>A rug can always be cleaned.</strong>
                </p>
                <p className="text-white/90 text-lg leading-relaxed">
                  <strong>A rug can be restored.</strong>
                </p>
                <p className="text-white/90 text-lg leading-relaxed mb-4">
                  <strong>But undoing time carries a cost.</strong>
                </p>
                <p className="text-white/90 leading-relaxed">
                  This ensures consistent care is rewarded, occasional relapse is recoverable, and history cannot be rewritten endlessly without consequence.
                </p>
                <p className="text-white/90 text-lg leading-relaxed mt-4">
                  <strong>A liability requires obligation. OnchainRugs impose none.</strong>
                </p>
              </div>
            </div>
          </div>
        )



      case 'journey':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">End-to-End User Journey</h2>
              <p className="text-white/80">ERC-721-C compatible living HTML NFT that ages over time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">1. Generator</h3>
                <p className="text-white/80 leading-relaxed">
                  User customizes a rug with up to <strong>5 lines of unique text</strong> and selects from <strong>102 color palettes</strong>.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">2. Minting Cost</h3>
                <p className="text-white/80 leading-relaxed">
                  Cheap base price + line-by-line text cost (1–5 lines) + gas fees (dynamic entry pricing).
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">3. Ownership</h3>
                <p className="text-white/80 leading-relaxed">
                  <strong>ERC-721-C</strong> living HTML NFT that ages over time.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">4. Wallet Limit</h3>
                <p className="text-white/80 leading-relaxed">
                  Maximum <strong>10 NFTs per wallet</strong> (default, with exception system).
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">5. Collection Cap</h3>
                <p className="text-white/80 leading-relaxed">
                  <strong>10,000 NFTs maximum supply</strong>.
                </p>
                <p className="text-white/80 leading-relaxed mt-2">
                  Rarity rebalances when the cap is reached based on actual mint distribution.
                </p>
              </div>
            </div>
          </div>
        )

      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Revenue and Pricing Structure</h2>
              <p className="text-white/80">Complete economic model with royalties, attribution, and maintenance costs</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Primary Costs (User-Paid)</h3>
                <ul className="text-white/80 space-y-3">
                  <li><strong>Minting:</strong> Base price + additional per text line.</li>
                  <li><strong>Maintenance Fees:</strong>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• <strong>Cleaning:</strong> Free for <strong>11 days</strong> after each cleaning.</li>
                      <li>• <strong>Restoration:</strong> Reduces aging by one level. Optional and deliberately priced to discourage routine use.</li>
                      <li>• <strong>Master Restoration:</strong> Full aging reset. Optional and more expensive.</li>
                    </ul>
                  </li>
                  <li><strong>Laundering:</strong> Automatic refresh when:
                    <ul className="ml-6 mt-1 space-y-1">
                      <li>• Sale price exceeds a minimum threshold <strong>and</strong></li>
                      <li>• Sale price is greater than the max of the last three sales</li>
                    </ul>
                    <p className="text-white/80 mt-2 ml-6">Subject to marketplace support.</p>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Secondary Sale Royalties (ERC-2981)</h3>
                <p className="text-white/80 mb-4">
                  <strong>10 percent of sale price</strong>, subject to marketplace support:
                </p>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>1 percent</strong> to the Curator (original minter, for life)</li>
                  <li>• <strong>1 percent</strong> to the Diamond Frame Pool</li>
                  <li>• <strong>8 percent</strong> to the Creator / Protocol</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Referral Commissions (ERC-8021 Attribution Protocol)</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>5 percent of mint fee</strong> to referrer</li>
                  <li>• <strong>5 percent of marketplace fee</strong> to referrer</li>
                  <li>Referral system ready at contract level. UI pending.</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-300 mb-4">Marketplace Features</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>Fixed-Price Listings:</strong> Direct buy functionality</li>
                  <li>• <strong>Offer System:</strong> Make offers on unlisted NFTs (with expiration)</li>
                  <li>• <strong>Trusted Marketplaces:</strong> External platforms can record sales and trigger laundering</li>
                  <li>• <strong>Auto-Cancel Listings:</strong> Listings automatically cancel when NFT transfers (ERC-721-C compliance)</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'royalties':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Gem className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Royalties and Attribution</h2>
              <p className="text-white/80">ERC-2981 royalties and ERC-8021 attribution protocol</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-green-300 mb-4">Secondary Sale Royalties (ERC-2981)</h3>
              <p className="text-white/80 leading-relaxed mb-4">
                <strong>10 percent of sale price</strong>, subject to marketplace support:
              </p>
              <ul className="text-white/80 space-y-2 text-lg">
                <li>• <strong>1 percent</strong> to the Curator (original minter, for life)</li>
                <li>• <strong>1 percent</strong> to the Diamond Frame Pool</li>
                <li>• <strong>8 percent</strong> to the Creator / Protocol</li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">Referral Commissions (ERC-8021 Attribution Protocol)</h3>
              <ul className="text-white/80 space-y-2">
                <li>• <strong>5 percent of mint fee</strong> to referrer</li>
                <li>• <strong>5 percent of marketplace fee</strong> to referrer</li>
                <li>Referral system ready at contract level. UI pending.</li>
              </ul>
            </div>
          </div>
        )

      case 'aging':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Clock className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Aging Mechanics</h2>
              <p className="text-white/80">Living NFT system with dirt accumulation and texture aging</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-300 mb-4">Dirt Accumulation</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>Level 0:</strong> Clean</li>
                  <li>• <strong>Level 1:</strong> Dirty after 3 days</li>
                  <li>• <strong>Level 2:</strong> Very Dirty after 7 days</li>
                  <li>• <strong>11 days of free cleaning</strong> after each cleaning</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-300 mb-4">Aging Progression</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>11 levels (0–10)</strong></li>
                  <li>• Base rate: <strong>14 days per level</strong></li>
                  <li>• Level 10 represents maximum texture and age</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'frames':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Frame System</h2>
              <p className="text-white/80">Achievement-based progression through maintenance points</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <p className="text-white/90 leading-relaxed mb-4">
                Frames slow aging and represent long-term stewardship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-300 mb-4">Frame Tiers</h3>
                <ul className="text-white/80 space-y-3">
                  <li>• <strong>Bronze (25 points):</strong> 25 percent slower aging</li>
                  <li>• <strong>Silver (50 points):</strong> 50 percent slower aging + dirt immunity</li>
                  <li>• <strong>Gold (100 points):</strong> 80 percent slower aging + dirt immunity</li>
                  <li>• <strong>Diamond (200 points):</strong> 90 percent slower aging + dirt immunity + rare (limited to 200 NFTs)</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-300 mb-4">Maintenance Scoring</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• Cleaning: +2 points</li>
                  <li>• Restoration: 0 points</li>
                  <li>• Master Restoration: 0 points</li>
                  <li>• Laundering: +20 points</li>
                  <li>• Total Score = Σ all maintenance actions</li>
                  <li>• Frame Progression: Score thresholds determine frame level</li>
                  <li>• Points subject to final tuning before mainnet</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'pool':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Gem className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Diamond Frame Pool</h2>
              <p className="text-white/80">Royalties fund rare diamond frames for top maintainers</p>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-6">
              <ul className="text-white/80 space-y-3 text-lg">
                <li>• Funded by <strong>1 percent of all secondary-sale royalties</strong></li>
                <li>• <strong>Only Diamond-framed rugs can claim</strong></li>
                <li>• Strictly capped at <strong>200 rugs</strong></li>
                <li>• Prevents dilution and preserves long-term incentive integrity</li>
              </ul>
              <p className="text-white/90 mt-4 text-lg">
                Once the Diamond cap is reached, <strong>Gold becomes the highest attainable tier</strong>.
              </p>
            </div>
          </div>
        )

      case 'agents':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Cpu className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Agentic Maintenance System</h2>
              <p className="text-white/80">ERC-8004 compatible AI agent ecosystem with x402 v2 protocol</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">x402 v2 Protocol Overview</h3>
                <p className="text-white/80 mb-4">
                  x402 v2 is a decentralized payment protocol that enables AI agents to autonomously perform
                  blockchain transactions on behalf of users. Version 2 introduces enhanced security, multi-network
                  support, and programmable payment flows for maintenance operations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-cyan-300 font-medium mb-2">Key Features</h4>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• Cryptographic payment authorization</li>
                      <li>• On-chain transaction validation</li>
                      <li>• Multi-network compatibility</li>
                      <li>• Programmable payment limits</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-cyan-300 font-medium mb-2">Security</h4>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• User-controlled permissions</li>
                      <li>• Emergency pause functionality</li>
                      <li>• Transparent fee structures</li>
                      <li>• Time-based payment expiration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Delegated Maintenance Permissions</h3>
                <p className="text-white/80 mb-4">Owners may authorize a separate address to perform maintenance actions only.</p>
                <ul className="text-white/80 space-y-2">
                  <li>• Delegated agents <strong>cannot transfer NFTs</strong></li>
                  <li>• Cannot sell or approve transfers</li>
                  <li>• Can be <strong>revoked at any time</strong></li>
                </ul>
                <p className="text-white/80 mt-4">
                  This allows cold-wallet ownership, hot-wallet maintenance, and automation without custody risk.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">x402 v2 API Documentation</h3>
                <p className="text-white/80 mb-4">Complete API reference for integrating with x402 v2 protocol.</p>

                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded p-4">
                    <h4 className="text-cyan-300 font-medium mb-3">1. Create Payment Requirement</h4>
                    <p className="text-white/70 text-sm mb-3">
                      Request payment details from the x402 facilitator for the desired maintenance operation.
                    </p>
                    <div className="bg-black/50 rounded p-3">
                      <div className="text-green-400 text-xs mb-2"># Request payment details for cleaning Rug #123</div>
                      <div className="text-white/90 text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto">
                        <div>POST /api/x402/v2/facilitator</div>
                        <div>Content-Type: application/json</div>
                        <div>&nbsp;</div>
                        <div>{"{"}</div>
                        <div>&nbsp;&nbsp;"version": "2.0",</div>
                        <div>&nbsp;&nbsp;"action": "create_payment_requirement",</div>
                        <div>&nbsp;&nbsp;"price": "0.00001",</div>
                        <div>&nbsp;&nbsp;"description": "Clean Rug #123",</div>
                        <div>&nbsp;&nbsp;"resource": "/api/maintenance/action/123/clean",</div>
                        <div>&nbsp;&nbsp;"network": "shape-mainnet",</div>
                        <div>&nbsp;&nbsp;"deadline": 1735689600,</div>
                        <div>&nbsp;&nbsp;"userAddress": "0x..."</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                    <div className="mt-3 bg-black/30 rounded p-3">
                      <div className="text-yellow-400 text-xs font-medium mb-2">Response:</div>
                      <div className="text-white/90 text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto">
                        <div>{"{"}</div>
                        <div>&nbsp;&nbsp;"x402Version": "2.0",</div>
                        <div>&nbsp;&nbsp;"paymentId": "pay_abc123def456",</div>
                        <div>&nbsp;&nbsp;"accepts": [{"{"}</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"scheme": "exact",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"network": "shape-mainnet",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"asset": "0x0000000000000000000000000000000000000000",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"payTo": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"maxAmountRequired": "10000000000000",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"description": "Clean Rug #123",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"deadline": 1735689600</div>
                        <div>&nbsp;&nbsp;{"}"}],</div>
                        <div>&nbsp;&nbsp;"facilitatorSignature": "0x..."</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded p-4">
                    <h4 className="text-green-300 font-medium mb-3">2. Verify Payment Authorization</h4>
                    <p className="text-white/70 text-sm mb-3">
                      Submit signed payment authorization for facilitator verification.
                    </p>
                    <div className="bg-black/50 rounded p-3">
                      <div className="text-green-400 text-xs mb-2"># Submit signed payment payload</div>
                      <div className="text-white/90 text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto">
                        <div>POST /api/x402/v2/facilitator</div>
                        <div>Content-Type: application/json</div>
                        <div>x402-payment-tx: 0x8ba1f109551b...</div>
                        <div>&nbsp;</div>
                        <div>{"{"}</div>
                        <div>&nbsp;&nbsp;"version": "2.0",</div>
                        <div>&nbsp;&nbsp;"action": "verify_payment",</div>
                        <div>&nbsp;&nbsp;"paymentPayload": {"{"}</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"paymentId": "pay_abc123def456",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"signature": "0x...",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"userAddress": "0x...",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"amount": "10000000000000",</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"deadline": 1735689600,</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;"txHash": "0x8ba1f109551b..."</div>
                        <div>&nbsp;&nbsp;{"}"}</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded p-4">
                    <h4 className="text-blue-300 font-medium mb-3">3. Execute Maintenance Action</h4>
                    <p className="text-white/70 text-sm mb-3">
                      Perform the maintenance operation with verified payment proof.
                    </p>
                    <div className="bg-black/50 rounded p-3">
                      <div className="text-green-400 text-xs mb-2"># Execute cleaning with payment proof</div>
                      <div className="text-white/90 text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto">
                        <div>POST /api/maintenance/action/123/clean</div>
                        <div>x402-payment-verified: true</div>
                        <div>x402-payment-id: pay_abc123def456</div>
                        <div>x402-facilitator-sig: 0x...</div>
                        <div>&nbsp;</div>
                        <div>{"{"}</div>
                        <div>&nbsp;&nbsp;"agentAddress": "0x...",</div>
                        <div>&nbsp;&nbsp;"userAddress": "0x..."</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Agent Registry (ERC-8004)</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• On-chain agent identity registration</li>
                  <li>• Capability declaration and verification</li>
                  <li>• Reputation scoring and feedback system</li>
                  <li>• Cryptographic proof of service execution</li>
                </ul>
                <p className="text-white/80 mt-2">Smart contracts support ERC-8004, agent marketplace under development.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Agent Fees</h3>
                <p className="text-white/80 mb-4">
                  <strong>Free by default</strong>. Fee infrastructure exists only as long-term safeguards. No monetization of routine care or recovery unless explicitly enabled by governance.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Available Agent Services</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• <strong>Cleaning:</strong> Remove dirt overlay (free for 11 days, optional fees)</li>
                  <li>• <strong>Restoration:</strong> Reduce aging by 1 level</li>
                  <li>• <strong>Master Restoration:</strong> Full aging reset</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'ownership':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Ownership and Metadata</h2>
              <p className="text-white/80">Fully on-chain ERC-721-C NFTs with complete transparency</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <ul className="text-white/80 space-y-3">
                  <li>• <strong>Fully on-chain Living HTML NFT</strong></li>
                  <li>• No IPFS dependencies</li>
                  <li>• All rendering logic and state stored on-chain</li>
                  <li>• Unique text combinations used <strong>only once globally</strong></li>
                  <li>• Complete maintenance and ownership history recorded permanently</li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Complete Metadata</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• All traits, history, curator address, transaction data</li>
                  <li>• Frame Level & Maintenance Score</li>
                  <li>• Dirt & Texture Levels</li>
                  <li>• Mint & Last Cleaned Times</li>
                  <li>• Complete Ownership History</li>
                  <li>• Cleaning & Restoration Counts</li>
                  <li>• Laundering Events</li>
                  <li>• Frame Achievement Timestamps</li>
                  <li>• Trading History & Prices</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'standards':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Standards Integration</h2>
              <p className="text-white/80">ERC compliance and technical architecture</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-cyan-300 font-bold text-lg">721-C</span>
                </div>
                <div className="text-white/80 text-sm">Creator Token Standard</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-300 font-bold text-lg">2981</span>
                </div>
                <div className="text-white/80 text-sm">Royalty Standard</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-300 font-bold text-lg">8021</span>
                </div>
                <div className="text-white/80 text-sm">Attribution Protocol</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-300 font-bold text-lg">8004</span>
                </div>
                <div className="text-white/80 text-sm">AI Agent Standard</div>
              </div>

              <div className="text-center col-span-2 md:col-span-4 mt-4">
                <div className="w-16 h-16 bg-orange-400/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-300 font-bold text-lg">2535</span>
                </div>
                <div className="text-white/80 text-sm">Diamond Standard (Multi-facet Architecture)</div>
              </div>
            </div>
          </div>
        )

      case 'result':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <HelpCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Final Result</h2>
              <p className="text-white/80">Living digital artifacts that behave like physical objects</p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-lg p-6 mb-6">
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                OnchainRugs produce <strong>fully on-chain generative artworks</strong> whose appearance, rarity, and history evolve over time.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/90 leading-relaxed mb-4">
                Each rug:
              </p>
              <ul className="text-white/80 space-y-2">
                <li>• Is <strong>complete at mint</strong></li>
                <li>• <strong>Evolves visually over time</strong></li>
                <li>• <strong>Accumulates history</strong></li>
                <li>• Reflects care, neglect, and market validation</li>
                <li>• Preserves provenance permanently on-chain</li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-white/90 leading-relaxed mb-4">
                <strong>Rarity is not fixed.</strong>
              </p>
              <p className="text-white/90 leading-relaxed mb-4">
                <strong>Value is not forced.</strong>
              </p>
              <p className="text-white/90 leading-relaxed mb-4">
                <strong>Nothing is hidden.</strong>
              </p>
              <p className="text-white/90 leading-relaxed">
                This is not a game of extraction. It is a system of consequence.
              </p>
            </div>
          </div>
        )

      case 'result':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <HelpCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
              <p className="text-white/80">Everything you need to know about OnchainRugs</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What are OnchainRugs?</h3>
                <p className="text-white/80 leading-relaxed">
                  OnchainRugs are fully on-chain generative NFT rugs that evolve over time. Each rug develops dirt and aging naturally,
                  requiring regular maintenance to stay pristine. They combine authentic textile art with blockchain mechanics for a unique
                  living digital artifact experience.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">How does the aging system work?</h3>
                <p className="text-white/80 leading-relaxed">
                  <strong>Dirt Accumulation:</strong> Builds up every 3-7 days from last cleaning. Regular cleaning resets dirt to 0.<br/><br/>
                  <strong>Texture Aging:</strong> Occurs over time from your last cleaning (30-180+ days). Texture age advances to the next level based on time since last maintenance.<br/><br/>
                  <strong>Regular Cleaning Delays Aging:</strong> Each cleaning resets the aging timer, preventing aging from advancing to the next level until the timer restarts.<br/><br/>
                  <strong>Restoration Options:</strong> Aging restoration reduces aging level by 1 + cleans dirt. Master restoration resets both dirt and aging level completely.<br/><br/>
                  Higher frame levels slow aging progression and provide dirt immunity benefits.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What are frame levels?</h3>
                <p className="text-white/80 leading-relaxed">
                  Frame levels (Bronze, Silver, Gold, Platinum, Diamond) are earned through maintenance points from cleaning and restoration services.
                  Each level provides benefits: dirt immunity, slower aging, and eventually permanent museum status for Diamond frames.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What&apos;s the difference between testnet and mainnet?</h3>
                <p className="text-white/80 leading-relaxed">
                  On testnet, aging happens much faster (minutes instead of days, hours instead of months) for easier testing.
                  Mainnet uses real-world timeframes to create meaningful long-term ownership experiences.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What is x402 technology?</h3>
                <p className="text-white/80 leading-relaxed">
                  x402 is a decentralized payment protocol that enables AI agents to autonomously perform maintenance operations.
                  Users authorize payments once, then AI agents can automatically clean and maintain rugs according to predefined schedules.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">How do I mint a rug?</h3>
                <p className="text-white/80 leading-relaxed">
                  Connect your wallet, choose up to 5 lines of custom text, and mint your rug. The cost depends on the amount of text you add.
                  Each rug is completely unique with generative patterns, colors, and your personal message woven into the design.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What are the maintenance costs?</h3>
                <p className="text-white/80 leading-relaxed">
                  <strong>Cleaning:</strong> Free onchain transaction for first 7 days after minting. After that, there&apos;s a grace period, followed by a minor transaction fee.<br/><br/>
                  <strong>Texture Restoration:</strong> Small payment required (affordable for regular maintenance).<br/><br/>
                  <strong>Master Restoration:</strong> Higher cost for complete rug refresh.<br/><br/>
                  <strong>Laundering:</strong> Free automatic restoration on qualifying high-value sales.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Can I trade my rug?</h3>
                <p className="text-white/80 leading-relaxed">
                  Yes! When you sell your rug above a threshold price, it automatically receives a full restoration (dirt and aging reset).
                  This creates interesting trading dynamics where well-maintained rugs become more valuable.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What&apos;s the maximum supply?</h3>
                <p className="text-white/80 leading-relaxed">
                  10,000 rugs maximum, with the ability to expand if community demand grows. This ensures scarcity while allowing for project evolution.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Are the rugs fully on-chain?</h3>
                <p className="text-white/80 leading-relaxed">
                  Yes! Everything is stored on-chain: the art generation algorithm, color palettes, text rendering, and all aging mechanics.
                  Each rug is a self-contained HTML NFT that renders perfectly in any wallet or marketplace.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/30 backdrop-blur-sm"
      >
        <LiquidGlass
          blurAmount={0.15}
          aberrationIntensity={2}
          elasticity={0.1}
          cornerRadius={16}
        >
          <div
            className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
            style={{
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-extension-ignore="true"
            data-no-wallet="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-40">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">OnchainRugs White Paper</h1>
                  <p className="text-white/60 text-sm">Living Digital Art That Requires Care</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-white/10 flex-wrap min-h-[60px] items-center relative z-20">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap relative z-30 ${
                      activeSection === section.id
                        ? 'text-cyan-300 bg-white/5'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                    <span className="sm:hidden">{section.label.split(' ')[0]}</span>
                    {activeSection === section.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-300 z-10"></div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 relative z-10 pointer-events-none">
              <div className="pointer-events-auto">
              {renderSectionContent()}
              </div>
            </div>
          </div>
        </LiquidGlass>
      </motion.div>
    </AnimatePresence>
  )
}
