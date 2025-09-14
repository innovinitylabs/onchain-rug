'use client';

import LiquidGlass from '@/components/LiquidGlass';

export default function GlassDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-400 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Liquid Glass Demo
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-lg">
          Experience the power of Liquid Glass - advanced glass morphism effects with real-time parameter control.
          Move your mouse over the elements to see the interactive refraction and glass effects.
        </p>
      </div>

      {/* Main Demo Section */}
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Interactive Demo */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-8 text-white">Interactive Glass Panel</h2>
          <p className="text-gray-400 mb-8">Use the controls below to adjust parameters in real-time</p>

          <div className="flex justify-center">
            <LiquidGlass
              blurAmount={0.6}
              aberrationIntensity={2}
              elasticity={0.2}
              className="p-12 max-w-2xl"
              showControls={true}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Interactive Liquid Glass</h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  This panel demonstrates advanced glass morphism with real-time parameter control.
                  Move your mouse around to see the refraction effects and use the controls to fine-tune the appearance.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm text-gray-300">Mouse Tracking</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-sm text-gray-300">Real-time Controls</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🌈</div>
                    <div className="text-sm text-gray-300">Chromatic Aberration</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-2xl mb-2">💫</div>
                    <div className="text-sm text-gray-300">Elastic Effects</div>
                  </div>
                </div>
              </div>
            </LiquidGlass>
          </div>
        </section>

        {/* Different Configurations */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-white text-center">Different Glass Styles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Subtle Glass */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">Subtle Glass</h3>
              <LiquidGlass
                blurAmount={0.3}
                aberrationIntensity={1}
                className="p-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-lg">🌊</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Minimal Effect</h4>
                  <p className="text-gray-400 text-sm">Low blur, subtle refraction</p>
                </div>
              </LiquidGlass>
            </div>

            {/* Medium Glass */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Balanced Glass</h3>
              <LiquidGlass
                blurAmount={0.7}
                aberrationIntensity={2}
                elasticity={0.3}
                className="p-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-lg">💎</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Balanced Effect</h4>
                  <p className="text-gray-400 text-sm">Medium blur with elasticity</p>
                </div>
              </LiquidGlass>
            </div>

            {/* Intense Glass */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-pink-400">Intense Glass</h3>
              <LiquidGlass
                blurAmount={0.9}
                aberrationIntensity={3}
                elasticity={0.5}
                className="p-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <span className="text-lg">🔮</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Maximum Effect</h4>
                  <p className="text-gray-400 text-sm">High blur, strong refraction</p>
                </div>
              </LiquidGlass>
            </div>

            {/* Button Style */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-green-400">Button Glass</h3>
              <LiquidGlass
                blurAmount={0.5}
                aberrationIntensity={1.5}
                className="px-8 py-4 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="text-center">
                  <span className="text-white font-semibold">Click Me</span>
                </div>
              </LiquidGlass>
            </div>

            {/* Card Style */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">Card Glass</h3>
              <LiquidGlass
                blurAmount={0.4}
                aberrationIntensity={2}
                elasticity={0.2}
                className="p-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">Glass Card</h4>
                  <p className="text-gray-400 text-sm">Perfect for content cards</p>
                </div>
              </LiquidGlass>
            </div>

            {/* Notification Style */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-red-400">Notification Glass</h3>
              <LiquidGlass
                blurAmount={0.6}
                aberrationIntensity={1}
                className="p-4"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-green-400">●</span>
                    <span className="text-white text-sm font-medium">System Online</span>
                  </div>
                  <p className="text-gray-400 text-xs">All systems operational</p>
                </div>
              </LiquidGlass>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white/5 rounded-3xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-white text-center">Technical Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-2xl">🖥️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">SSR Compatible</h3>
              <p className="text-gray-400 text-sm">Works perfectly with Next.js server-side rendering</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">SVG Filters</h3>
              <p className="text-gray-400 text-sm">Advanced displacement maps for realistic refraction</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Hardware Accelerated</h3>
              <p className="text-gray-400 text-sm">GPU-accelerated effects for smooth performance</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">🎛️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Real-time Controls</h3>
              <p className="text-gray-400 text-sm">Interactive parameter adjustment</p>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-white text-center">Usage Examples</h2>
          <div className="bg-gray-800/50 rounded-2xl p-6 font-mono text-sm text-gray-300">
            <pre className="whitespace-pre-wrap">{`// Basic usage
<LiquidGlass className="p-6">
  <div>Your content here</div>
</LiquidGlass>

// With custom parameters
<LiquidGlass
  blurAmount={0.6}
  aberrationIntensity={2}
  elasticity={0.3}
  className="p-8 rounded-xl"
>
  <div>Custom glass effect</div>
</LiquidGlass>

// With interactive controls
<LiquidGlass
  showControls={true}
  blurAmount={0.5}
  aberrationIntensity={1.5}
  className="p-12"
>
  <div>Interactive demo</div>
</LiquidGlass>`}</pre>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-8">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready to Use</h2>
            <p className="text-gray-400 mb-6">
              This Liquid Glass component is production-ready and fully compatible with modern React applications.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/liquid-glass" className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                View Original Demo
              </a>
              <a href="/" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Back to Home
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
