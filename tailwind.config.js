/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fcf9fd',
          100: '#f7f1f9',
          200: '#ede3f0',
          300: '#ddcce3',
          400: '#b9a5c0',
          500: '#927d9a',
          600: '#735f7b',
          700: '#584764',
          800: '#40334b',
          900: '#2c2235',
        },
        primary: {
          50: '#fdf5fe',
          100: '#f9e8fc',
          200: '#f2cdf8',
          300: '#e5a6ef',
          400: '#d77ce6',
          500: '#ca5cdd',
          600: '#be2ed6',
          700: '#a523bd',
          800: '#871e9a',
          900: '#6e1b7c',
        },
        accent: {
          50: '#fdf5fe',
          100: '#f9e8fc',
          200: '#f2cdf8',
          300: '#e5a6ef',
          400: '#d77ce6',
          500: '#ca5cdd',
          600: '#be2ed6',
          700: '#a523bd',
          800: '#871e9a',
          900: '#6e1b7c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}