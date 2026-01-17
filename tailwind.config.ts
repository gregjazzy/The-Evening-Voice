import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      // Breakpoints personnalisés pour iPad
      'sm': '640px',
      'md': '768px',      // iPad Mini portrait
      'tablet': '834px',  // iPad Air/Pro portrait  
      'lg': '1024px',     // iPad landscape / Desktop
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Palette Luxe & Magie - Nuit étoilée
        midnight: {
          50: '#f0f1f8',
          100: '#dfe1f0',
          200: '#c5c8e4',
          300: '#a3a8d3',
          400: '#8085bf',
          500: '#6366aa',
          600: '#545194',
          700: '#464479',
          800: '#3b3a64',
          900: '#1a1832',
          950: '#0d0c1a',
        },
        stardust: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        aurora: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        dream: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        }
      },
      fontFamily: {
        'display': ['"Cormorant Garamond"', 'Georgia', 'serif'],
        'body': ['"Nunito"', 'system-ui', 'sans-serif'],
        'handwriting': ['"Caveat"', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'stars': 'radial-gradient(ellipse at bottom, #1a1832 0%, #0d0c1a 100%)',
        'magic-glow': 'radial-gradient(circle at center, rgba(233, 121, 249, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(233, 121, 249, 0.3)',
        'glow-lg': '0 0 40px rgba(233, 121, 249, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(233, 121, 249, 0.2)',
        'dreamy': '0 8px 32px rgba(99, 102, 170, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config

