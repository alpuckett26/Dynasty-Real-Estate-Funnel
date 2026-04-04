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
        // Warm gold — refined accent
        brand: {
          50: '#fdf9f0',
          100: '#f8edcc',
          200: '#f0d898',
          300: '#e5be5c',
          400: '#d9a230',
          500: '#c4851e',
          600: '#a56a17',
          700: '#875416',
          800: '#6c4315',
          900: '#583713',
          950: '#301c07',
        },
        // Warm charcoal — replaces cold navy
        navy: {
          50: '#f8f7f5',
          100: '#eeeae6',
          200: '#ddd8cf',
          300: '#c6bdb0',
          400: '#aa9e8f',
          500: '#8e8275',
          600: '#73675f',
          700: '#5c534e',
          800: '#4b4340',
          900: '#332e2b',
          950: '#1c1714',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
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
