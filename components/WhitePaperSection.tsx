'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Sparkles } from 'lucide-react'
import WhitePaperModal from './WhitePaperModal'

export default function WhitePaperSection() {
  const [isWhitePaperOpen, setIsWhitePaperOpen] = useState(false)

  return (
    <>
      {/* White Paper Section */}
      <section id="white-paper-section" className="relative py-20 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium border border-cyan-500/30">
              <Sparkles className="w-4 h-4" />
              Project Documentation
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Learn More About{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                OnchainRugs
              </span>
            </h2>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Discover the artistic vision, technical architecture, and gameplay mechanics
              behind our living digital art project. Everything you need to understand
              the future of NFTs that require care and attention.
            </p>

            <motion.button
              onClick={() => setIsWhitePaperOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-cyan-400/30"
            >
              <FileText className="w-5 h-5" />
              Read White Paper
            </motion.button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">6</div>
                <div className="text-sm text-slate-400">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">10K</div>
                <div className="text-sm text-slate-400">Max Supply</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">500+</div>
                <div className="text-sm text-slate-400">Maintenance Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">∞</div>
                <div className="text-sm text-slate-400">Generative Art</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Accent Lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
      </section>

      {/* White Paper Modal */}
      <WhitePaperModal
        isOpen={isWhitePaperOpen}
        onClose={() => setIsWhitePaperOpen(false)}
      />
    </>
  )
}
