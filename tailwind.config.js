/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Azul da marca (primário)
        primary: {
          50:  '#eaf0f7',
          100: '#cdd8ea',
          200: '#a0b7d6',
          300: '#7396c1',
          400: '#3f6fa6',
          500: '#0b2a4a',   // base (nav/logo)
          600: '#09243f',
          700: '#071d33',
          800: '#051829',
          900: '#04121f',
          DEFAULT: '#0b2a4a',
        },
        // Amarelo dourado (destaques/CTA secundário)
        accent: {
          50:  '#fff9e6',
          100: '#ffefb3',
          200: '#ffe380',
          300: '#ffd74d',
          400: '#ffcb26',
          500: '#f2c300',   // base (ramos dourados)
          600: '#d4a900',
          700: '#a88000',
          800: '#7d5d00',
          900: '#503a00',
          DEFAULT: '#f2c300',
        },
        // Neutros suaves para fundos/bordas
        slate: colors.slate,
      },
      boxShadow: {
        card: '0 10px 25px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  plugins: [],
}
