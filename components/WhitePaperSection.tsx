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
      <section className="relative py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Project Documentation
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Learn More About{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                OnchainRugs
              </span>
            </h2>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover the artistic vision, technical architecture, and gameplay mechanics
              behind our living digital art project. Everything you need to understand
              the future of NFTs that require care and attention.
            </p>

            <motion.button
              onClick={() => setIsWhitePaperOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileText className="w-5 h-5" />
              Read White Paper
            </motion.button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 mb-1">5</div>
                <div className="text-sm text-gray-600">Sections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 mb-1">10K</div>
                <div className="text-sm text-gray-600">Max Supply</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 mb-1">500+</div>
                <div className="text-sm text-gray-600">Maintenance Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 mb-1">∞</div>
                <div className="text-sm text-gray-600">Generative Art</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </section>

      {/* White Paper Modal */}
      <WhitePaperModal
        isOpen={isWhitePaperOpen}
        onClose={() => setIsWhitePaperOpen(false)}
      />
    </>
  )
}
