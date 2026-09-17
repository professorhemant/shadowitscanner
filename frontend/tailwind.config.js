/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
        surface: { DEFAULT: '#0f172a', card: '#1e293b', border: '#334155' },
        risk: { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' },
      },
    },
  },
  plugins: [],
};
