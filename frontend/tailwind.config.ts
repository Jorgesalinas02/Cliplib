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
        // Identity palette
        brand: {
          bg:      '#F5F0E8',
          pink:    '#F4A7B9',
          yellow:  '#F5D76E',
          olive:   '#B5C45A',
          blue:    '#B8D4E8',
          purple:  '#C9B8E8',
          dark:    '#1A1A1A',
          'card-pink':   '#F9C5D1',
          'card-yellow': '#F5E080',
          'card-green':  '#C8D96A',
          'card-blue':   '#C5DCF0',
        },
      },
      borderRadius: {
        card: '14px',
        badge: '999px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
