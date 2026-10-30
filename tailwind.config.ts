import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ngl: {
          pink: '#EC1187',
          orange: '#FF8D10',
          coral: '#FF4500',
          dark: '#08030C',
        },
        brand: {
          50: '#fff1f5',
          100: '#ffe0ea',
          400: '#ff5c8a',
          500: '#f43f6f',
          600: '#e11d5a',
          700: '#be1450',
        },
      },
    },
  },
  plugins: [],
};
export default config;
