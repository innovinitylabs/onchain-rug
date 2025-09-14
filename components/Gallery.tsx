'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ExternalLink, Shuffle, Heart } from 'lucide-react'

// Sample doormat data (in real app, this would come from your doormat generator)
const sampleDoormats = [
  {
    id: 1,
    seed: 42,
    palette: "Tamil Cultural",
    text: ["WELCOME", "HOME"],
    rarity: "Rare",
    traits: {
      stripeCount: 28,
      textLines: 2,
      complexity: "Moderate"
    }
  },
  {
    id: 2,
    seed: 123,
    palette: "Peacock",
    text: ["NAMASTE"],
    rarity: "Epic",
    traits: {
      stripeCount: 35,
      textLines: 1,
      complexity: "Complex"
    }
  },
  {
    id: 3,
    seed: 777,
    palette: "Bengal Famine",
    text: ["PEACE", "LOVE", "JOY"],
    rarity: "Legendary",
    traits: {
      stripeCount: 42,
      textLines: 3,
      complexity: "Very Complex"
    }
  },
  {
    id: 4,
    seed: 999,
    palette: "Mediterranean",
    text: ["BLESSED"],
    rarity: "Uncommon",
    traits: {
      stripeCount: 22,
      textLines: 1,
      complexity: "Simple"
    }
  },
  {
    id: 5,
    seed: 555,
    palette: "Maratha Empire",
    text: ["STRENGTH", "HONOR"],
    rarity: "Epic",
    traits: {
      stripeCount: 31,
      textLines: 2,
      complexity: "Complex"
    }
  },
  {
    id: 6,
    seed: 888,
    palette: "Jamakalam",
    text: ["LEGACY"],
    rarity: "Rare",
    traits: {
      stripeCount: 26,
      textLines: 1,
      complexity: "Moderate"
    }
  }
]

const rarityColors = {
  Common: "text-gray-600 bg-gray-100",
  Uncommon: "text-green-600 bg-green-100",
  Rare: "text-blue-600 bg-blue-100",
  Epic: "text-purple-600 bg-purple-100",
  Legendary: "text-indigo-600 bg-indigo-100"
}

function DoormatCard({ doormat, index }: { doormat: typeof sampleDoormats[0], index: number }) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
    >
      <motion.div
        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-200/50"
        whileHover={{ scale: 1.02, y: -5 }}
      >
        {/* Doormat Preview */}
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-indigo-100 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
              <div className="p-4 text-white text-center">
                <div className="text-xs font-bold mb-2">Seed: {doormat.seed}</div>
                <div className="space-y-1">
                  {doormat.text.map((line, i) => (
                    <div key={i} className="text-sm font-mono">{line}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Like button */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200"
          >
            <Heart className={`w-5 h-5 transition-colors duration-200 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-blue-800">Doormat #{doormat.id}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${rarityColors[doormat.rarity as keyof typeof rarityColors]}`}>
              {doormat.rarity}
            </span>
          </div>
          
          <p className="text-blue-700/70 mb-4">
            {doormat.palette} palette with {doormat.traits.textLines} text {doormat.traits.textLines === 1 ? 'line' : 'lines'}
          </p>
          
          {/* Traits */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-600">{doormat.traits.stripeCount}</div>
              <div className="text-xs text-blue-700/70">Stripes</div>
            </div>
            <div className="text-center bg-indigo-50 rounded-lg p-2">
              <div className="text-lg font-bold text-indigo-600">{doormat.traits.textLines}</div>
              <div className="text-xs text-indigo-700/70">Text Lines</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-2">
              <div className="text-sm font-bold text-purple-600">{doormat.traits.complexity}</div>
              <div className="text-xs text-purple-700/70">Complexity</div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Details
            </motion.button>
            <motion.button
              className="p-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExternalLink className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Gallery() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            🎨 Gallery
          </h2>
          <p className="text-xl text-blue-700/70 max-w-3xl mx-auto mb-8">
            Explore unique onchain rugs designs showcasing the diversity of our generative art system.
            Each piece tells a story woven into the fabric of tradition and innovation.
          </p>
          
          <motion.button
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shuffle className="w-5 h-5" />
            Generate Random
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleDoormats.map((doormat, index) => (
            <DoormatCard key={doormat.id} doormat={doormat} index={index} />
          ))}
        </div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
                      <motion.button
              className="bg-white/60 backdrop-blur-sm border-2 border-blue-300 text-blue-700 px-8 py-4 rounded-full font-medium hover:bg-blue-50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Load More Rugs
            </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
