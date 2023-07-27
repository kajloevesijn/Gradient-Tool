/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss'

module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    strokeColors: {
      'white': '#ffffff',
      'black': '#000000',
    },
    strokeWidth:{
      'thin': '1px',
      'medium': '2px',
      'large': '3px',
      'xlarge': '4px',
    },
    extend: {
      boxShadow: {
        '3xl': '0 0 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
    textFillColor: theme => theme('strokeColors.white'),
    textStrokeColor: theme => theme('strokeColors.black'),
    textStrokeWidth: theme => theme('strokeWidth.large'),
    paintOrder: {
      'fsm': { paintOrder: 'fill stroke markers' },
      'fms': { paintOrder: 'fill markers stroke' },
      'sfm': { paintOrder: 'stroke fill markers' },
      'smf': { paintOrder: 'stroke markers fill' },
      'mfs': { paintOrder: 'markers fill stroke' },
      'msf': { paintOrder: 'markers stroke fill' },
    },
  },
  plugins: [require('tailwindcss-text-fill-stroke'),],
}