'use client'

import { motion } from 'framer-motion'
import { ChevronDown, Sparkles, Star } from 'lucide-react'

export default function Hero() {
  return (
    <div className="relative z-10 h-screen flex items-center justify-center text-center px-6" style={{ willChange: 'transform' }}>
      <div className="max-w-4xl mx-auto" style={{ willChange: 'transform, opacity' }}>
        {/* Floating elements - Delayed for performance optimization */}
        <div className="absolute -top-10 -left-10 w-20 h-20 opacity-20" style={{ willChange: 'transform' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              y: [0, -20, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              opacity: { duration: 0.5, delay: 2.5 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.5 },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.5 }
            }}
            style={{ willChange: 'transform' }}
          >
            <Sparkles className="w-full h-full text-amber-600" />
          </motion.div>
        </div>
        
        <div className="absolute -top-5 -right-5 w-16 h-16 opacity-30" style={{ willChange: 'transform' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              y: [0, 15, 0],
              rotate: [0, -360]
            }}
            transition={{ 
              opacity: { duration: 0.5, delay: 2.8 },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.8 },
              rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", type: "tween", delay: 2.8 }
            }}
            style={{ willChange: 'transform' }}
          >
            <Star className="w-full h-full text-orange-500" />
          </motion.div>
        </div>

        {/* Main content - Optimized for performance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, type: "tween" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5, type: "tween" }}
            style={{ willChange: 'transform' }}
          >
            🧶 ONCHAIN RUG
          </motion.h1>
          
          <motion.p 
            className="text-2xl md:text-3xl text-amber-800/80 font-semibold mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, type: "tween" }}
            style={{ willChange: 'opacity' }}
          >
            Generative Doormat Art on the Blockchain
          </motion.p>
          
          <motion.p 
            className="text-lg md:text-xl text-amber-700/70 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "tween" }}
            style={{ willChange: 'transform, opacity' }}
          >
            Each NFT is a unique, woven masterpiece with 102 color palettes, and 
            custom text embedding. 
            <br />
            <span className="font-semibold">Max supply: 1111 onchain rugs</span>
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, type: "tween" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <motion.a
              href="/generator"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ willChange: 'transform' }}
            >
              🚀 Start Creating
            </motion.a>
            
            <motion.a
              href="/mint"
              className="border-2 border-amber-500 text-amber-700 px-8 py-4 rounded-full text-lg font-bold hover:bg-amber-50 transition-all duration-300 inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ willChange: 'transform' }}
            >
              🚀 Mint Now
            </motion.a>
          </motion.div>
        </motion.div>

      </div>
    </div>
  )
}
