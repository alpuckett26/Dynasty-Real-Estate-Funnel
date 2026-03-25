import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#faefd9',
          200: '#f4dba8',
          300: '#ecc16d',
          400: '#e3a23a',
          500: '#d4851e',
          600: '#b96614',
          700: '#974b13',
          800: '#7b3c16',
          900: '#643315',
          950: '#38190a',
        },
        navy: {
          50: '#f0f4fa',
          100: '#dde6f3',
          200: '#c2d2ea',
          300: '#98b5db',
          400: '#6892c7',
          500: '#4873b4',
          600: '#375b99',
          700: '#2e4a7d',
          800: '#2a4069',
          900: '#273858',
          950: '#1a2438',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
