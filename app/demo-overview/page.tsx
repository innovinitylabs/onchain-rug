'use client';

import Link from 'next/link';

export default function DemoOverviewPage() {
  const demos = [
    {
      title: 'Liquid Glass Demos',
      description: 'Interactive liquid glass effect demonstrations with various configurations',
      href: '/glass-demo',
      color: 'from-cyan-500 to-purple-500',
      icon: '✨',
      features: ['Real-time controls', 'Multiple styles', 'SSR compatible', 'Interactive effects']
    },
    {
      title: 'Original Liquid Glass Demo',
      description: 'The original liquid glass demo with interactive controls',
      href: '/liquid-glass',
      color: 'from-purple-500 to-pink-500',
      icon: '🎨',
      features: ['Interactive panel', 'Parameter controls', 'Mouse tracking', 'Glass morphism']
    },
    {
      title: 'Home Page',
      description: 'Main application page with navigation and features',
      href: '/',
      color: 'from-amber-500 to-orange-500',
      icon: '🏠',
      features: ['Navigation', 'Features showcase', 'Gallery preview', 'Responsive design']
    },
    {
      title: 'Generator',
      description: 'NFT generation tool for creating onchain rugs',
      href: '/generator',
      color: 'from-green-500 to-emerald-500',
      icon: '🎨',
      features: ['Pattern generation', 'Color palettes', 'Text embedding', 'Preview system']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Demo Overview
        </h1>
        <p className="text-gray-300 max-w-3xl mx-auto text-xl">
          Explore our interactive demonstrations showcasing advanced web technologies,
          liquid glass effects, and generative art capabilities.
        </p>
      </div>

      {/* Demo Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">

          {demos.map((demo, index) => (
            <Link
              key={index}
              href={demo.href}
              className="group block"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${demo.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}>
                    {demo.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {demo.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {demo.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {demo.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-medium group-hover:text-cyan-300 transition-colors">
                    Explore Demo →
                  </span>
                  <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center group-hover:bg-cyan-400/30 transition-colors">
                    <span className="text-cyan-400 text-sm">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

        </div>

        {/* Technical Summary */}
        <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-8 text-white text-center">Technical Highlights</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-2xl">
                ⚛️
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Next.js 15</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Latest Next.js with App Router, server components, and optimized performance
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                🎨
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Liquid Glass</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Advanced glass morphism with SVG filters, refraction, and real-time controls
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-2xl">
                🎯
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Generative Art</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Onchain NFT generation with 102+ color palettes and authentic weaving patterns
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 bg-white/10 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-white font-medium">Server Status: Online</span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="text-gray-400">
                All demos running at <span className="text-cyan-400 font-mono">http://localhost:3000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500">
            Built with Next.js, React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
