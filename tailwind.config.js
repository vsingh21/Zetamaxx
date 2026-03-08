/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        shake: "shake 0.3s ease-in-out",
        "fade-in": "fade-in 0.15s ease-out",
        "pulse-green": "pulse-green 0.2s ease-out",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-green": {
          "0%": { backgroundColor: "rgb(34 197 94 / 0.2)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
    },
  },
  plugins: [],
};
