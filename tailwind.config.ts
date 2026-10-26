import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#070d1a', 900: '#0b1426', 800: '#111d36', 700: '#1a2a4d' },
        gold: { 300: '#ecd08a', 400: '#e0b95a', 500: '#d4a63c', 600: '#b88a26' },
        ink: '#10131a',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: { soft: '0 10px 30px -12px rgba(11,20,38,.25)' },
    },
  },
  plugins: [],
} satisfies Config;
