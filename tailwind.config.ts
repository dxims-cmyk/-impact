import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AM:PM Core Navy Palette
        navy: {
          DEFAULT: '#0B1220',
          deep: '#070D17',
          light: '#132035',
        },
        // Warm Neutrals
        ivory: '#F5F5DC',
        camel: '#D4A574',
        chocolate: '#2A1E1A',
        'warm-white': '#FAF8F5',
        // Impact Division - Primary Brand
        impact: {
          DEFAULT: '#6E0F1A',
          light: '#8B1422',
          dark: '#5A0C15',
        },
        // Other Divisions (for reference)
        vision: '#1E3A5F',
        studio: '#2D4A3E',
        creative: '#4A3728',
        // Pipeline stage colors
        pipeline: {
          new: '#6E0F1A',
          qualified: '#8B1422',
          contacted: '#D4A574',
          booked: '#2D4A3E',
          won: '#2D4A3E',
          lost: '#4A3728',
        },
        // Temperature colors
        temperature: {
          hot: '#6E0F1A',
          warm: '#D4A574',
          cold: '#1E3A5F',
        },
        // UI Colors
        success: '#2D4A3E',
        warning: '#D4A574',
        error: '#6E0F1A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
