import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0F0F10',
          pink: '#FF4DA6',
          white: '#FFFFFF'
        }
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
}
export default config
