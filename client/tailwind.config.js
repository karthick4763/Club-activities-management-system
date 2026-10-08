/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED', 
          hover: '#5B21B6',   
          light: '#EDE9FE',   
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        brand: {
          primary: '#7C3AED',
          primaryHover: '#5B21B6',
          primaryLight: '#EDE9FE',
          accent: '#8B5CF6',
          accentHover: '#7C3AED',
          lightBg: '#F8FAFC',
          border: '#CBD5E1',
          textDark: '#0F172A',
          emerald: '#16A34A',
          emeraldAccent: '#00C853',
        },
        navy: {
          DEFAULT: '#7C3AED',
          800: '#7C3AED',
          900: '#5B21B6',
        }
      }
    },
  },
  plugins: [],
}
