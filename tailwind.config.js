/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        f6: {
          cyan: '#00e5ff',
          blue: '#0088ff',
          pink: '#f43f5e',
          magenta: '#d946ef',
          purple: '#9333ea',
          dark: '#080c14',
          card: '#0f172a',
          surface: '#1e293b',
          border: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px -3px rgba(0, 229, 255, 0.4), 0 0 6px -2px rgba(0, 229, 255, 0.2)',
        'neon-magenta': '0 0 15px -3px rgba(217, 70, 239, 0.4), 0 0 6px -2px rgba(217, 70, 239, 0.2)',
        'neon-glow': '0 0 25px -5px rgba(0, 229, 255, 0.3), 0 0 25px -5px rgba(217, 70, 239, 0.3)',
      },
      backgroundImage: {
        'f6-gradient': 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 50%, #d946ef 100%)',
        'f6-card': 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
      }
    },
  },
  plugins: [],
}
