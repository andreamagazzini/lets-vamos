/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#02182c', // Very dark navy - main brand
          dark: '#010f1a', // Darker for hover states
          light: '#033a5e', // Lighter navy for subtle backgrounds
        },
        accent: {
          DEFAULT: '#2888fb', // Bright blue - accent color
          light: '#5ba3fc', // Lighter blue for hover
          dark: '#1e6fd9', // Darker blue for pressed states
        },
        background: {
          DEFAULT: '#fcfcfa', // Off-white/cream background
          alt: '#f8f8f6', // Slightly darker for cards
        },
        success: {
          DEFAULT: '#10b981', // Green
          light: '#34d399', // Lighter green
        },
        warning: {
          DEFAULT: '#f59e0b', // Orange
          light: '#fbbf24', // Lighter orange
        },
        error: {
          DEFAULT: '#ef4444', // Red
          light: '#f87171', // Lighter red
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'modern-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
