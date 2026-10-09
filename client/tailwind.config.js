/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf7',
          100: '#dcfce9',
          500: '#1e5f4a', // Muted, confident deep green
          600: '#174b3a',
          700: '#113a2d',
          DEFAULT: '#1e5f4a',
        },
        surface: {
          DEFAULT: '#FAFAFA',
          dark: '#0B0F19',
          cardDark: '#111827',
          cardSubtleDark: '#1F2937',
        },
        neutralDark: '#1A1A1A',
        subtleBorder: {
          DEFAULT: '#E5E7EB',
          dark: '#1F2937',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
