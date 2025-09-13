'use client';

import LiquidGlass from '@/components/LiquidGlass';

export default function LiquidGlassDemo() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Liquid Glass Effect</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Interactive glass morphism components with mouse-responsive effects,
          built using custom shader-inspired techniques.
        </p>
      </div>

      {/* Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

        {/* Basic Card */}
        <LiquidGlass className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Basic Card</h3>
            <p className="text-gray-600">Simple glass morphism effect</p>
          </div>
        </LiquidGlass>

        {/* Interactive Button */}
        <LiquidGlass
          intensity={0.8}
          chromaticAberration={3}
          className="p-4 cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Interactive</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Hover Me
            </button>
          </div>
        </LiquidGlass>

        {/* High Intensity */}
        <LiquidGlass
          intensity={0.9}
          elasticity={0.3}
          className="p-6"
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">High Blur</h3>
            <p className="text-gray-600">Intense glass effect</p>
          </div>
        </LiquidGlass>

        {/* Low Blur */}
        <LiquidGlass
          intensity={0.3}
          chromaticAberration={1}
          className="p-6"
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Subtle</h3>
            <p className="text-gray-600">Light glass effect</p>
          </div>
        </LiquidGlass>

        {/* Elastic */}
        <LiquidGlass
          elasticity={0.5}
          intensity={0.7}
          className="p-6"
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Elastic</h3>
            <p className="text-gray-600">Smooth transitions</p>
          </div>
        </LiquidGlass>

        {/* Custom Content */}
        <LiquidGlass
          className="p-6"
          style={{ background: 'linear-gradient(45deg, rgba(255,0,150,0.1), rgba(0,204,255,0.1))' }}
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">🎨 Custom</h3>
            <div className="flex justify-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-pink-400 rounded-full"></div>
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
            </div>
            <p className="text-gray-600 text-sm">Custom gradients & colors</p>
          </div>
        </LiquidGlass>

      </div>

      {/* Large Demo */}
      <div className="max-w-4xl mx-auto mt-16">
        <LiquidGlass
          intensity={0.6}
          chromaticAberration={2}
          elasticity={0.2}
          className="p-12"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Large Glass Panel</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This demonstrates the Liquid Glass effect on a larger surface area.
              Move your mouse around to see the interactive glass morphism effects.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="bg-white/20 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">{'🎯🎨🎭🎪'[i % 4]}</div>
                  <div className="text-sm text-gray-600">Item {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </LiquidGlass>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <div className="bg-gray-50 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">About This Implementation</h3>
          <p className="text-gray-600 mb-4">
            This custom Liquid Glass implementation uses:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <div className="font-semibold mb-2">🎨 CSS Effects</div>
              <div className="text-gray-600">backdrop-filter, blur, gradients</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="font-semibold mb-2">🖱️ Interactions</div>
              <div className="text-gray-600">Mouse tracking, hover effects</div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="font-semibold mb-2">⚡ Performance</div>
              <div className="text-gray-600">CSS-only, hardware accelerated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
