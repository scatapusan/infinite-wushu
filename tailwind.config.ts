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
        cyan:    { DEFAULT: "#00b4e6", foreground: "#080c1a" },
        gold:    { DEFAULT: "#d4a030", foreground: "#080c1a" },
        crimson: { DEFAULT: "#e85d4a", foreground: "#ffffff" },
        ink:      "#080c1a",
        surface:  "#0d1328",
        parchment:"#e0eaf0",
        // High-saturation overrides for the practice view (2–3 m distance).
        practice: {
          pass: "#00FF88",
          warn: "#FFD700",
          fail: "#FF3355",
          ref:  "#00D4FF",
          bg:   "#050B1A",
        },
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
      // Practice-distance typography (2–3 m viewing distance).
      // Nothing smaller than practice-small (28px) may appear in the practice view.
      fontSize: {
        "practice-hero":   ["5rem",    { lineHeight: "1",   fontWeight: "900" }],
        "practice-large":  ["3.5rem",  { lineHeight: "1.1", fontWeight: "800" }],
        "practice-medium": ["2.5rem",  { lineHeight: "1.1", fontWeight: "700" }],
        "practice-small":  ["1.75rem", { lineHeight: "1.2", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};

export default config;
