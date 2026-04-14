import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        cyan: {
          DEFAULT: "#00b4e6",
          foreground: "#080c1a",
        },
        gold: {
          DEFAULT: "#d4a030",
          foreground: "#080c1a",
        },
        crimson: {
          DEFAULT: "#e85d4a",
          foreground: "#ffffff",
        },
        ink: "#080c1a",
        surface: "#0d1328",
        parchment: "#e0eaf0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        chinese: ["var(--font-chinese)", "Noto Serif SC", "serif"],
      },
      borderRadius: {
        "card-sm": "10px",
        "card-md": "12px",
        card: "16px",
        "card-lg": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
