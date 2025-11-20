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
  const [activeSection, setActiveSection] = useState<'artistic' | 'project' | 'gameplay' | 'x402' | 'tech' | 'faq'>('artistic')


  if (!isOpen) return null

  const sections = [
    { id: 'artistic', label: 'Artistic Vision', icon: Palette },
    { id: 'project', label: 'Project Vision', icon: Target },
    { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
    { id: 'x402', label: 'x402 Technology', icon: Cpu },
    { id: 'tech', label: 'Technical Details', icon: Zap },
    { id: 'faq', label: 'FAQ', icon: HelpCircle }
  ] as const

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'artistic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Palette className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Artistic Vision</h2>
              <p className="text-white/80">Living fully OnChain Digital Art That Evolves With Time</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Generative Doormat Art</h3>
                <p className="text-white/80 leading-relaxed">
                  OnchainRugs features unique woven textile patterns inspired by traditional rug-making techniques.
                  Each rug is algorithmically generated using advanced P5.js rendering, creating infinite variations
                  of cultural textile patterns from Persian heritage to modern abstract designs.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Temporal Aesthetics</h3>
                <p className="text-white/80 leading-relaxed">
                  Unlike static NFTs, OnchainRugs evolve visually over time through natural aging processes.
                  Dirt accumulation and texture development create character and storytelling, turning each rug
                  into a living digital artifact that tells the story of its care and ownership history.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Personalization Layer</h3>
                <p className="text-white/80 leading-relaxed">
                  Owners can embed personal messages and text within their rugs, creating meaningful connections
                  between the art and its collector. This text integration adds emotional depth and transforms
                  each rug into a personalized digital heirloom.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Cultural Heritage</h3>
                <p className="text-white/80 leading-relaxed">
                  Drawing inspiration from centuries of textile craftsmanship, OnchainRugs celebrates the beauty
                  of woven art while exploring how digital technology can preserve and evolve these traditions
                  for future generations.
                </p>
              </div>
            </div>
          </div>
        )

      case 'project':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Project Vision</h2>
              <p className="text-white/80">Redefining Digital Ownership Through Care</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold text-white mb-4">Core Philosophy</h3>
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                OnchainRugs represents the next evolution of NFTs - not just collectibles, but <strong>living Onchain digital artifacts </strong>
                that require care and attention. We believe this creates deeper emotional connections between collectors
                and their art, mirroring how we care for physical objects in the real world.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-white mb-2">Time-Based Value</h4>
                <p className="text-white/70">
                  Value emerges through temporal relationships - how collectors care for their rugs over time
                  becomes part of the art itself.
                </p>
              </div>

              <div className="text-center">
                <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-white mb-2">Community Care</h4>
                <p className="text-white/70">
                  We encourage a culture of digital stewardship where collectors maintain their rugs,
                  creating shared values and community bonds.
                </p>
              </div>

              <div className="text-center">
                <Gem className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-white mb-2">Museum Quality</h4>
                <p className="text-white/70">
                  Diamond-framed rugs become permanent museum pieces, representing the ultimate
                  achievement in digital curation.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Our Mission</h3>
              <p className="text-white/90 leading-relaxed">
                To explore how <strong>time and care</strong> can create meaning and value in digital ownership.
                Inspired by the care we give physical objects, OnchainRugs brings that same sense of stewardship
                to the digital realm, creating emotional attachments that transcend traditional collectibles.
              </p>
            </div>
          </div>
        )

      case 'gameplay':
        return (
          <div
            className="space-y-6"
            data-no-wallet="true"
            style={{ isolation: 'isolate' }}
          >
            <div className="text-center mb-8">
              <Gamepad2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Gameplay Mechanics</h2>
              <p className="text-white/80">Living Art That Requires Active Care</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">Dirt Accumulation System</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-white">0-3 days: Clean (no dirt)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-white">3 days: Light dirt accumulation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-white">7 days: Heavy soiling</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mt-4">
                  Regular cleaning prevents dirt buildup and earns maintenance points toward frame achievements.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Texture Aging System</h3>
                <div className="space-y-3">
                  <p className="text-white/80">Texture aging occurs over time from the last cleaning:</p>
                  <ul className="text-white/70 space-y-1 text-sm">
                    <li>• 0-30 days from last clean: Fresh appearance</li>
                    <li>• 31-90 days from last clean: Subtle texture development</li>
                    <li>• 91-180 days from last clean: Noticeable wear patterns</li>
                    <li>• 180+ days from last clean: Mature character development</li>
                  </ul>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="bg-slate-800/50 rounded p-3">
                    <h5 className="text-cyan-300 font-medium mb-2">Restoration Mechanics:</h5>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• <strong>Regular Cleaning:</strong> Resets dirt only (texture aging continues)</li>
                      <li>• <strong>Texture Restoration:</strong> Reduces texture age by 1 level + cleans dirt</li>
                      <li>• <strong>Master Restoration:</strong> Resets both dirt AND texture age to 0</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/50 rounded p-3">
                    <h5 className="text-green-300 font-medium mb-2">Cleaning Costs:</h5>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• <strong>Free (7 days):</strong> No cost for first 7 days after minting</li>
                      <li>• <strong>Grace Period:</strong> Extended free window after last cleaning</li>
                      <li>• <strong>Minor Fee:</strong> Small onchain transaction cost after grace period</li>
                    </ul>
                  </div>
                </div>
                <p className="text-white/70 text-sm mt-4">
                  Higher frame levels slow texture aging progression, preserving your rug&apos;s appearance longer.
                </p>
                {/* Prevent extension interference */}
                <div style={{ display: 'none' }} data-wallet-ignore="true"></div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Frame Achievement System</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span className="text-white font-medium">Bronze (25 points)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span className="text-white font-medium">Silver (50 points) - Dirt Immunity</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-white font-medium">Gold (100 points) - 25% slower aging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span className="text-white font-medium">Platinum (200 points) - 50% slower aging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-cyan-400 rounded"></div>
                    <span className="text-white font-medium">Diamond (500 points) - Museum Piece</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Maintenance Services</h3>
                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded p-3">
                    <h5 className="text-cyan-300 font-medium mb-1">Regular Cleaning</h5>
                    <p className="text-white/70 text-sm">Resets dirt level to 0 (texture aging continues from last clean)</p>
                  </div>
                  <div className="bg-slate-800/30 rounded p-3">
                    <h5 className="text-cyan-300 font-medium mb-1">Texture Restoration</h5>
                    <p className="text-white/70 text-sm">Reduces texture age by 1 level + resets dirt to 0</p>
                  </div>
                  <div className="bg-slate-800/30 rounded p-3">
                    <h5 className="text-cyan-300 font-medium mb-1">Master Restoration</h5>
                    <p className="text-white/70 text-sm">Resets both dirt AND texture age to 0 (complete refresh)</p>
                  </div>
                  <div className="bg-slate-800/30 rounded p-3">
                    <h5 className="text-cyan-300 font-medium mb-1">Laundering</h5>
                    <p className="text-white/70 text-sm">Automatic full restoration on qualifying high-value sales</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Economic Incentives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-green-300 font-medium mb-2">Well-Maintained Rugs</h4>
                  <p className="text-white/70 text-sm">Never age if regularly cleaned, earn frame achievements</p>
                </div>
                <div>
                  <h4 className="text-blue-300 font-medium mb-2">Neglected Rugs</h4>
                  <p className="text-white/70 text-sm">Develop valuable &quot;character&quot; through natural aging</p>
                </div>
                <div>
                  <h4 className="text-purple-300 font-medium mb-2">Trading Benefits</h4>
                  <p className="text-white/70 text-sm">Higher sale prices trigger automatic rejuvenation</p>
                </div>
                <div>
                  <h4 className="text-yellow-300 font-medium mb-2">Museum Status</h4>
                  <p className="text-white/70 text-sm">Diamond frames become permanent heirlooms</p>
                </div>
              </div>
            </div>

            {/* Prevent extension injection */}
            <style jsx>{`
              .whitepaper-modal {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
              }
              .whitepaper-modal * {
                pointer-events: auto !important;
              }
            `}</style>
          </div>
        )

      case 'x402':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Cpu className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">x402 Technology</h2>
              <p className="text-white/80">AI-Powered Maintenance Automation</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-semibold text-white mb-4">What is x402?</h3>
              <p className="text-white/90 leading-relaxed">
                x402 is a decentralized payment protocol that enables AI agents to autonomously perform
                blockchain transactions on behalf of users. It provides a secure framework for AI-driven
                maintenance operations, allowing rug cleaning and restoration services to be automated
                through intelligent agents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">How It Works</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">1</div>
                    <div>
                      <h5 className="text-white font-medium">Payment Request</h5>
                      <p className="text-white/70 text-sm">AI agent requests permission for maintenance operation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">2</div>
                    <div>
                      <h5 className="text-white font-medium">User Approval</h5>
                      <p className="text-white/70 text-sm">User signs payment authorization for the service</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">3</div>
                    <div>
                      <h5 className="text-white font-medium">Blockchain Settlement</h5>
                      <p className="text-white/70 text-sm">Payment is verified and settled on-chain</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">4</div>
                    <div>
                      <h5 className="text-white font-medium">Service Execution</h5>
                      <p className="text-white/70 text-sm">AI agent performs the maintenance operation</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Security Features</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Cryptographic signature verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">On-chain transaction validation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">User-controlled payment limits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Transparent fee structures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Emergency pause functionality</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Network Support</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-white">Shape L2 (Primary)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-white">Base Sepolia (Testnet)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-white">Ethereum Mainnet (Future)</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm mt-3">
                  x402 operates on multiple networks with consistent security and functionality.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Timing Parameters</h3>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-white font-medium">Mainnet Timing</h5>
                    <ul className="text-white/70 text-sm space-y-1 mt-1">
                      <li>• Dirt accumulation: Days-based</li>
                      <li>• Texture aging: Weeks/months-based</li>
                      <li>• Free cleaning windows: Days-based</li>
                      <li>• Frame grace periods: Days-based</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-white font-medium">Testnet Timing</h5>
                    <ul className="text-white/70 text-sm space-y-1 mt-1">
                      <li>• Dirt accumulation: Minutes-based</li>
                      <li>• Texture aging: Hours-based</li>
                      <li>• Free cleaning windows: Minutes-based</li>
                      <li>• Frame grace periods: Hours-based</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-300 mb-4">How Users Can Use x402</h3>
              <div className="space-y-4">
                <p className="text-white/80 leading-relaxed">
                  Users can interact with x402 through various interfaces - from direct API calls to AI agents.
                  Here are common ways to use x402 for rug maintenance:
                </p>

                <div className="bg-slate-800/50 rounded p-4">
                  <h5 className="text-cyan-300 font-medium mb-2">Direct API Usage</h5>
                  <p className="text-white/70 text-sm mb-3">
                    Make HTTP requests to maintenance endpoints with payment payloads:
                  </p>
                  <div className="bg-black/50 rounded p-3 font-mono text-xs text-green-400 overflow-x-auto">
                    <div className="mb-2">POST /api/maintenance/action/123/clean</div>
                    <div className="text-white/60">Headers:</div>
                    <div>x402-payment-payload: {"{...}"}</div>
                    <div>x402-payment-status: payment-submitted</div>
                    <div>x402-payment-tx: 0x...</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded p-4">
                  <h5 className="text-cyan-300 font-medium mb-2">Sample 402 Request</h5>
                  <p className="text-white/70 text-sm mb-3">
                    When requesting rug maintenance, you'll receive a 402 response with payment requirements:
                  </p>
                  <div className="bg-black/50 rounded p-3 font-mono text-xs text-yellow-400 overflow-x-auto">
                    <div>HTTP 402 Payment Required</div>
                    <div className="mt-2 text-white/60">Response Body:</div>
                    <div className="text-blue-400">{"{"}</div>
                    <div className="ml-4">"x402Version": 1,</div>
                    <div className="ml-4">"accepts": [{"{"}</div>
                    <div className="ml-8">"scheme": "exact",</div>
                    <div className="ml-8">"network": "shape-sepolia",</div>
                    <div className="ml-8">"asset": "0x000...000",</div>
                    <div className="ml-8">"payTo": "0xFacilitatorAddress",</div>
                    <div className="ml-8">"maxAmountRequired": "1000000000000000",</div>
                    <div className="ml-8">"description": "Rug cleaning service"</div>
                    <div className="ml-4">{"}"}]</div>
                    <div className="text-blue-400">{"}"}</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded p-4">
                  <h5 className="text-cyan-300 font-medium mb-2">AI Agent Commands</h5>
                  <p className="text-white/70 text-sm mb-3">
                    Use natural language commands with AI agents:
                  </p>
                  <div className="bg-black/50 rounded p-3">
                    <div className="text-green-400 font-mono text-sm">
                      "Clean my rug #123" → AI handles payment & execution
                    </div>
                    <div className="text-green-400 font-mono text-sm mt-2">
                      "Restore texture on rug #456" → AI manages the process
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">AI Agent Integration</h3>
              <p className="text-white/90 leading-relaxed">
                The x402 protocol enables autonomous AI agents to maintain rugs according to user-defined
                schedules and preferences. Agents can monitor rug conditions, request payments for necessary
                maintenance, and execute cleaning operations - all while maintaining full user control and
                transparency over every transaction.
              </p>
            </div>
          </div>
        )

      case 'tech':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Technical Architecture</h2>
              <p className="text-white/80">Diamond Pattern Smart Contracts & On-Chain Art</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">Diamond Pattern Architecture</h3>
                <div className="space-y-3">
                  <p className="text-white/80">Modular smart contract system enabling:</p>
                  <ul className="text-white/70 space-y-1">
                    <li>• RugNFTFacet: ERC721 core functionality</li>
                    <li>• RugAgingFacet: Dirt & texture mechanics</li>
                    <li>• RugMaintenanceFacet: Cleaning services</li>
                    <li>• RugCommerceFacet: Pricing & withdrawals</li>
                    <li>• RugAdminFacet: Owner controls</li>
                    <li>• RugLaunderingFacet: Auto-cleaning on sales</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Art Generation System</h3>
                <div className="space-y-3">
                  <p className="text-white/80">On-chain generative art using:</p>
                  <ul className="text-white/70 space-y-1">
                    <li>• P5.js canvas rendering (800x1200px)</li>
                    <li>• Deterministic seeded randomness</li>
                    <li>• 100+ cultural color palettes</li>
                    <li>• Pixel-perfect text integration</li>
                    <li>• Scripty.sol external library storage</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Storage Optimization</h3>
                <div className="space-y-3">
                  <p className="text-white/80">Efficient on-chain storage:</p>
                  <ul className="text-white/70 space-y-1">
                    <li>• Minimal seed + parameters storage</li>
                    <li>• External P5.js library via Scripty.sol</li>
                    <li>• SSTORE2 for compressed data</li>
                    <li>• Base64 encoded HTML output</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Security Features</h3>
                <div className="space-y-3">
                  <p className="text-white/80">Comprehensive protection:</p>
                  <ul className="text-white/70 space-y-1">
                    <li>• Reentrancy protection</li>
                    <li>• Input validation</li>
                    <li>• Owner controls & emergency pause</li>
                    <li>• Transparent pricing & limits</li>
                    <li>• Unique text hash enforcement</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">x402 Integration</h3>
                <div className="space-y-4">
                  <p className="text-white/80 leading-relaxed">
                    x402 protocol integration enables programmable payments for maintenance operations:
                  </p>

                  <div className="bg-slate-800/50 rounded p-4">
                    <h5 className="text-cyan-300 font-medium mb-2">API Endpoints</h5>
                    <div className="space-y-2 font-mono text-xs text-green-400">
                      <div>POST /api/maintenance/action/{'{tokenId}'}/clean</div>
                      <div>POST /api/maintenance/action/{'{tokenId}'}/restore</div>
                      <div>POST /api/maintenance/action/{'{tokenId}'}/master-restore</div>
                      <div>GET /api/maintenance/quote/{'{tokenId}'}/{'{action}'}</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded p-4">
                    <h5 className="text-cyan-300 font-medium mb-2">Payment Flow</h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">1</div>
                        <div>
                          <h6 className="text-white font-medium">Request Quote</h6>
                          <p className="text-white/70">GET quote endpoint returns 402 with payment requirements</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">2</div>
                        <div>
                          <h6 className="text-white font-medium">Submit Payment</h6>
                          <p className="text-white/70">Send transaction to facilitator address with exact amount</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">3</div>
                        <div>
                          <h6 className="text-white font-medium">Execute Action</h6>
                          <p className="text-white/70">POST to action endpoint with payment proof</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded p-4">
                    <h5 className="text-cyan-300 font-medium mb-2">Supported Networks</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/80">Shape L2 (Primary)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-white/80">Base Sepolia (Testnet)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-white/80">Ethereum Mainnet (Future)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Network & Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <h4 className="text-cyan-300 font-medium mb-2">Primary Network</h4>
                  <p className="text-white/80 text-sm">Shape L2</p>
                  <p className="text-white/60 text-xs">Low gas, fast transactions</p>
                </div>
                <div className="text-center">
                  <h4 className="text-green-300 font-medium mb-2">Gas Estimates</h4>
                  <p className="text-white/80 text-sm">Mint: ~25k gas</p>
                  <p className="text-white/60 text-xs">Clean: ~15k gas</p>
                </div>
                <div className="text-center">
                  <h4 className="text-blue-300 font-medium mb-2">Max Supply</h4>
                  <p className="text-white/80 text-sm">10,000 NFTs</p>
                  <p className="text-white/60 text-xs">Expandable by owner</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Transparent Metadata System</h3>
              <p className="text-white/90 mb-4">
                All game data is fully visible in NFT metadata for complete transparency:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-black/20 rounded p-3">
                  <h5 className="text-cyan-300 font-medium mb-2">Core Attributes</h5>
                  <ul className="text-white/70 space-y-1">
                    <li>• Frame Level & Maintenance Score</li>
                    <li>• Dirt & Texture Levels</li>
                    <li>• Mint & Last Cleaned Times</li>
                    <li>• Complete Ownership History</li>
                  </ul>
                </div>
                <div className="bg-black/20 rounded p-3">
                  <h5 className="text-green-300 font-medium mb-2">Maintenance History</h5>
                  <ul className="text-white/70 space-y-1">
                    <li>• Cleaning & Restoration Counts</li>
                    <li>• Laundering Events</li>
                    <li>• Frame Achievement Timestamps</li>
                    <li>• Trading History & Prices</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'faq':
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
                  OnchainRugs are fully on-chain generative NFT rugs that evolve over time. Each rug develops dirt and texture naturally,
                  requiring regular maintenance to stay pristine. They combine authentic textile art with blockchain mechanics for a unique
                  living digital artifact experience.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">How does the aging system work?</h3>
                <p className="text-white/80 leading-relaxed">
                  <strong>Dirt Accumulation:</strong> Builds up every 3-7 days from last cleaning. Regular cleaning resets dirt to 0.<br/><br/>
                  <strong>Texture Aging:</strong> Occurs over time from your last cleaning (30-180+ days). Texture age is not reversible until restored.<br/><br/>
                  <strong>Restoration Options:</strong> Texture restoration reduces age by 1 level + cleans dirt. Master restoration resets both dirt and texture age completely.<br/><br/>
                  Higher frame levels slow texture aging progression and provide dirt immunity benefits.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">What are frame levels?</h3>
                <p className="text-white/80 leading-relaxed">
                  Frame levels (Bronze, Silver, Gold, Platinum, Diamond) are earned through maintenance points from cleaning and restoration services.
                  Each level provides benefits: dirt immunity, slower texture aging, and eventually permanent museum status for Diamond frames.
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
                  Yes! When you sell your rug above a threshold price, it automatically receives a full restoration (dirt and texture reset).
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
            className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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
            <div className="flex items-center justify-between p-6 border-b border-white/10">
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
            <div className="flex border-b border-white/10 overflow-x-auto min-h-[60px] items-center">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSection === section.id
                        ? 'text-cyan-300 border-b-2 border-cyan-300 bg-white/5'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderSectionContent()}
            </div>
          </div>
        </LiquidGlass>
      </motion.div>
    </AnimatePresence>
  )
}
