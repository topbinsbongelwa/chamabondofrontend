/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep green school colour
        primary: {
          DEFAULT: '#0B5D3B',
          50: '#EDF7F2',
          100: '#D3EDE1',
          200: '#A8DBC4',
          300: '#72C2A1',
          400: '#3E9F7B',
          500: '#0B5D3B',
          600: '#094A30',
          700: '#073A25',
          800: '#05291B',
          900: '#03180F',
        },
        // Gold accent - small details only (logo mark, hover underline, divider)
        gold: {
          DEFAULT: '#D4AF37',
          300: '#E3C766',
          400: '#DCBE55',
          500: '#D4AF37',
          600: '#B4922B',
          700: '#8C7021',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 32px -12px rgba(16, 24, 40, 0.12)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
}
