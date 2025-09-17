'use client'

import { motion } from 'framer-motion'
import { Palette, Type, Zap, Shield, Sparkles, Globe, Clock } from 'lucide-react'

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
    <section className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-400 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            ✨ Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
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
              <motion.div
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 h-full"
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">1111</div>
              <div className="text-gray-300 font-medium">Max Supply</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">102</div>
              <div className="text-gray-300 font-medium">Color Palettes</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-pink-400 mb-2">5</div>
              <div className="text-gray-300 font-medium">Text Rows</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">∞</div>
              <div className="text-gray-300 font-medium">Unique Combinations</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
