'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'

export default function Footer() {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false)

  const credits = [
    {
      name: "Next.js",
      description: "The React Framework for Production",
      license: "MIT",
      link: "https://nextjs.org/"
    },
    {
      name: "React",
      description: "A JavaScript library for building user interfaces",
      license: "MIT",
      link: "https://reactjs.org/"
    },
    {
      name: "Tailwind CSS",
      description: "A utility-first CSS framework",
      license: "MIT",
      link: "https://tailwindcss.com/"
    },
    {
      name: "Framer Motion",
      description: "A production-ready motion library for React",
      license: "MIT",
      link: "https://www.framer.com/motion/"
    },
    {
      name: "p5.js",
      description: "JavaScript library for creative coding",
      license: "LGPL",
      link: "https://p5js.org/"
    },
    {
      name: "Wagmi",
      description: "React hooks for Ethereum",
      license: "MIT",
      link: "https://wagmi.sh/"
    },
    {
      name: "RainbowKit",
      description: "The best way to connect a wallet",
      license: "MIT",
      link: "https://www.rainbowkit.com/"
    },
    {
      name: "Lucide React",
      description: "Beautiful & consistent icon toolkit",
      license: "ISC",
      link: "https://lucide.dev/"
    },
    {
      name: "Liquid Glass React",
      description: "Apple's Liquid Glass effect for React",
      license: "MIT",
      link: "https://github.com/rdev/liquid-glass-react"
    },
    {
      name: "Scripty.sol",
      description: "Gas efficient, storage agnostic, on-chain HTML builder",
      license: "MIT",
      link: "https://github.com/intartnft/scripty.sol"
    },
    {
      name: "Diamond-2",
      description: "Diamond pattern implementation for smart contracts",
      license: "MIT",
      link: "https://github.com/mudgen/diamond-2"
    }
  ]

  return (
    <footer className="relative bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-3">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright and Brand */}
          <div className="text-center md:text-left">
            <div className="text-base font-medium text-gray-300">
              © 2025 Onchain Rugs by{' '}
              <a
                href="https://valipokkann.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-semibold"
              >
                valipokkann
              </a>
            </div>
          </div>

          {/* Credits Toggle */}
          <div className="text-center md:text-right">
            <button
              onClick={() => setIsCreditsOpen(!isCreditsOpen)}
              className="group relative text-xs text-gray-500 hover:text-cyan-400 transition-colors duration-200 uppercase tracking-wider font-medium"
            >
              Credits
              <motion.div
                animate={{ rotate: isCreditsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline ml-1"
              >
                <ChevronDown className="w-3 h-3" />
              </motion.div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Project credits & licenses
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Credits Section */}
        <AnimatePresence>
          {isCreditsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-8"
            >
              <div className="border-t border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-white mb-6 text-center">
                  Credits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {credits.map((credit, index) => (
                    <motion.div
                      key={credit.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <h4 className="font-semibold text-white mb-1">
                        <a
                          href={credit.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 transition-colors duration-200"
                        >
                          {credit.name}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">
                        {credit.description}
                      </p>
                      <span className="inline-block px-2 py-1 bg-gray-700 text-xs text-cyan-400 rounded">
                        {credit.license}
                      </span>
                    </motion.div>
                  ))}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"></div>
    </footer>
  )
}
