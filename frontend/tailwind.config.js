/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dbe2ff',
          300: '#bfc9ff',
          400: '#9aa5ff',
          500: '#717bff',
          600: '#5255f7',
          700: '#4241e0',
          800: '#3634b8',
          900: '#302f94',
        }
      }
    },
  },
  plugins: [],
}
