/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0f050a",
          sidebar: "#1a0a14",
          card: "#1e0d19",
          accent: "#d5aa65",
          gold: "#e6c998",
          text: "#f5ecd7",
          muted: "#8e705c",
          input: "#2a1221",
          border: "#33182a",
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
