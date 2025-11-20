'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react'

const faqs = [
  {
    question: "What are OnchainRugs?",
    answer: "OnchainRugs are fully on-chain generative NFT rugs that evolve over time. Each rug develops dirt and texture naturally, requiring regular maintenance to stay pristine. They combine authentic textile art with blockchain mechanics for a unique living digital artifact experience."
  },
  {
    question: "How does the aging system work?",
    answer: "Rugs accumulate dirt every 3-7 days and develop texture over weeks to months. Dirt can be cleaned to reset it, while texture requires restoration services. Higher frame levels slow the aging process and provide immunity benefits."
  },
  {
    question: "What are frame levels?",
    answer: "Frame levels (Bronze, Silver, Gold, Platinum, Diamond) are earned through maintenance points from cleaning and restoration services. Each level provides benefits: dirt immunity, slower texture aging, and eventually permanent museum status for Diamond frames."
  },
  {
    question: "What's the difference between testnet and mainnet?",
    answer: "On testnet, aging happens much faster (minutes instead of days, hours instead of months) for easier testing. Mainnet uses real-world timeframes to create meaningful long-term ownership experiences."
  },
  {
    question: "What is x402 technology?",
    answer: "x402 is a decentralized payment protocol that enables AI agents to autonomously perform maintenance operations. Users authorize payments once, then AI agents can automatically clean and maintain rugs according to predefined schedules."
  },
  {
    question: "How do I mint a rug?",
    answer: "Connect your wallet, choose up to 5 lines of custom text, and mint your rug. The cost depends on the amount of text you add. Each rug is completely unique with generative patterns, colors, and your personal message woven into the design."
  },
  {
    question: "What are the maintenance costs?",
    answer: "Regular cleaning costs vary by network and timing. On testnet, services are very affordable (around 0.00001 ETH) to enable testing. Mainnet pricing will be set to encourage regular maintenance while remaining accessible."
  },
  {
    question: "Can I trade my rug?",
    answer: "Yes! When you sell your rug above a threshold price, it automatically receives a full restoration (dirt and texture reset). This creates interesting trading dynamics where well-maintained rugs become more valuable."
  },
  {
    question: "What's the maximum supply?",
    answer: "10,000 rugs maximum, with the ability to expand if community demand grows. This ensures scarcity while allowing for project evolution."
  },
  {
    question: "Are the rugs fully on-chain?",
    answer: "Yes! Everything is stored on-chain: the art generation algorithm, color palettes, text rendering, and all aging mechanics. Each rug is a self-contained HTML NFT that renders perfectly in any wallet or marketplace."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const scrollToWhitePaper = () => {
    const whitePaperSection = document.querySelector('#white-paper-section')
    if (whitePaperSection) {
      whitePaperSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq-section" className="relative py-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium border border-cyan-500/30 mb-6">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Got Questions?{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              We've Got Answers
            </span>
          </h2>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about OnchainRugs, from aging mechanics to x402 technology
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <p className="text-slate-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-8">
            <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">
              Still Have Questions?
            </h3>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Check out our comprehensive white paper or join our community for more detailed discussions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={scrollToWhitePaper}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <HelpCircle className="w-4 h-4" />
                Read White Paper
              </button>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200 border border-slate-600">
                <Sparkles className="w-4 h-4" />
                Join Community
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Accent Lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
    </section>
  )
}
