import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: "#0e1420",
        "surface-card": "#131b2c",
        "surface-card-hover": "#172339",
        "surface-border": "#1e293b",
        primary: {
          DEFAULT: "#00f0ff", // Neon Cyan
          hover: "#00d0de",
          dim: "rgba(0, 240, 255, 0.12)",
        },
        secondary: {
          DEFAULT: "#7928ca", // Electric Purple
          hover: "#6620aa",
          dim: "rgba(121, 40, 202, 0.12)",
        },
        accent: {
          DEFAULT: "#10b981", // Emerald
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)",
        "hero-glow":
          "radial-gradient(circle at 50% 30%, rgba(0, 240, 255, 0.15) 0%, rgba(121, 40, 202, 0.1) 45%, transparent 70%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 25px -5px rgba(0, 240, 255, 0.3)",
        "glow-purple": "0 0 25px -5px rgba(121, 40, 202, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
