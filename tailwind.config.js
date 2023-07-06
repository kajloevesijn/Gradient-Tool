/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss'

module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      boxShadow: {
        '3xl': '0 0 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}