'use client'

import { motion } from 'framer-motion'
import { Palette, Type, Zap, Shield, Sparkles, Globe, Clock } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

const features = [
  {
    icon: Palette,
    title: "102 Color Palettes",
    description: "A vast spectrum inspired by tradition, history, and nature. Each palette is uniquely classified by rarity, from Common to Legendary.",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: Type,
    title: "Custom Text Embedding",
    description: "Weave your story into the fabric. Up to 5 rows of text with authentic pixel-based font rendering. Each text combination is unique and cannot be used again.",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: Zap,
    title: "Authentic Weaving",
    description: "Not your average Web3 rug. Realistic warp and weft threads with natural curves, organic irregularities, and cloth-like texture.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Shield,
    title: "Fully On-Chain",
    description: "Self-contained HTML NFTs, optimized for on-chain storage. Ultra-compressed, with all rendering logic and metadata stored in HTML.",
    color: "from-purple-500 to-violet-500"
  },
  {
    icon: Sparkles,
    title: "Generative Traits",
    description: "Complex trait system with stripe patterns, palette rarity, text complexity, and weave authenticity.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Clock,
    title: "Dynamic Aging",
    description: "Dirt and texture development over time. Dirt can be removed with a cleaning, and texture can be reset with a laundering.",
    color: "from-teal-500 to-cyan-500"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  }
}

export default function Features() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold gradient-text mb-6">
            ✨ Features
          </h2>
          <p className="text-xl text-blue-700 max-w-3xl mx-auto">
            Revolutionary generative art meets traditional textile craftsmanship.
            Each onchain rugs is a unique masterpiece with deep cultural roots.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <LiquidGlass
                blurAmount={0.4}
                aberrationIntensity={1.5}
                elasticity={0.15}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200/50 h-full"
                mode="standard"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-blue-800 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-blue-700/80 leading-relaxed">
                  {feature.description}
                </p>
              </LiquidGlass>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <LiquidGlass
            blurAmount={0.3}
            aberrationIntensity={1}
            className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl p-8 md:p-12"
          >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">1111</div>
              <div className="text-blue-700 font-medium">Max Supply</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">102</div>
              <div className="text-blue-700 font-medium">Color Palettes</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">5</div>
              <div className="text-blue-700 font-medium">Text Rows</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-cyan-600 mb-2">∞</div>
              <div className="text-blue-700 font-medium">Unique Combinations</div>
            </div>
          </div>
          </LiquidGlass>
        </motion.div>

        {/* Interactive Liquid Glass Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              🎨 Interactive Glass Demo
            </h2>
            <p className="text-xl text-blue-700 max-w-2xl mx-auto">
              Experience the power of Liquid Glass technology. Move your mouse over the panel below to see real-time refraction effects.
            </p>
          </div>

          <div className="flex justify-center">
            <LiquidGlass
              blurAmount={0.5}
              aberrationIntensity={2}
              elasticity={0.2}
              className="max-w-2xl p-12"
              showControls={true}
              mode="standard"
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-blue-800">Liquid Glass Effect</h3>
                <p className="text-blue-700 mb-6 leading-relaxed">
                  This interactive panel demonstrates advanced glass morphism with real-time parameter control.
                  The glass effect responds to your mouse movement, creating realistic refraction and chromatic aberration.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-blue-50/80 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm font-medium text-blue-800">Mouse Tracking</div>
                  </div>
                  <div className="bg-indigo-50/80 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🌈</div>
                    <div className="text-sm font-medium text-indigo-800">Chromatic Effect</div>
                  </div>
                  <div className="bg-purple-50/80 p-4 rounded-lg">
                    <div className="text-2xl mb-2">💫</div>
                    <div className="text-sm font-medium text-purple-800">Elastic Response</div>
                  </div>
                </div>
              </div>
            </LiquidGlass>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
