import type { Config } from 'tailwindcss'

const config: Config = {
  // Disable lightningcss to avoid Vercel build issues
  corePlugins: {
    preflight: false,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ghibli-inspired theme colors
        primary: {
          50: '#eff6ff',   // blue-50
          100: '#dbeafe',  // blue-100
          200: '#bfdbfe',  // blue-200
          300: '#93c5fd',  // blue-300
          400: '#60a5fa',  // blue-400
          500: '#3b82f6',  // blue-500
          600: '#2563eb',  // blue-600
          700: '#1d4ed8',  // blue-700
          800: '#1e40af',  // blue-800
          900: '#1e3a8a',  // blue-900
        },
        secondary: {
          50: '#eef2ff',   // indigo-50
          100: '#e0e7ff',  // indigo-100
          200: '#c7d2fe',  // indigo-200
          300: '#a5b4fc',  // indigo-300
          400: '#818cf8',  // indigo-400
          500: '#6366f1',  // indigo-500
          600: '#4f46e5',  // indigo-600
          700: '#4338ca',  // indigo-700
          800: '#3730a3',  // indigo-800
          900: '#312e81',  // indigo-900
        },
        accent: {
          50: '#faf5ff',   // purple-50
          100: '#f3e8ff',  // purple-100
          200: '#e9d5ff',  // purple-200
          300: '#d8b4fe',  // purple-300
          400: '#c084fc',  // purple-400
          500: '#a855f7',  // purple-500
          600: '#9333ea',  // purple-600
          700: '#7c3aed',  // purple-700
          800: '#6b21a8',  // purple-800
          900: '#581c87',  // purple-900
        },
        highlight: {
          50: '#ecfeff',   // cyan-50
          100: '#cffafe',  // cyan-100
          200: '#a5f3fc',  // cyan-200
          300: '#67e8f9',  // cyan-300
          400: '#22d3ee',  // cyan-400
          500: '#06b6d4',  // cyan-500
          600: '#0891b2',  // cyan-600
          700: '#0e7490',  // cyan-700
          800: '#155e75',  // cyan-800
          900: '#164e63',  // cyan-900
        },
        // Semantic color aliases for easy theming
        theme: {
          'primary': 'var(--color-primary)',
          'secondary': 'var(--color-secondary)',
          'accent': 'var(--color-accent)',
          'highlight': 'var(--color-highlight)',
          'background': 'var(--color-background)',
          'surface': 'var(--color-surface)',
          'text': 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'ghibli-gradient': 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 25%, #bfdbfe 50%, #a5b4fc 75%, #818cf8 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
