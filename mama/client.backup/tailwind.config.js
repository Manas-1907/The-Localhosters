/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2B2340',
        petal: { DEFAULT: '#C4476A', dark: '#A53957' },
        mist: '#FAF5F8',
        leaf: '#2E8B7F',
        sun: '#F2B33D',
        line: '#E8DCE6',
        soft: '#6E6585',
      },
      fontFamily: { sans: ['Figtree', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
