import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#07090b",
          900: "#0b0f12",
          850: "#0f1418",
          800: "#141a1f",
          700: "#1c242b",
          600: "#2a343c",
        },
        nova: {
          green: "#3EEBA5",
          "green-dim": "#22B27A",
          purple: "#8B7CFF",
          blue: "#5B8CFF",
        },
        line: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "nova-radial":
          "radial-gradient(80% 60% at 15% 0%, rgba(139,124,255,0.16) 0%, rgba(139,124,255,0) 60%), radial-gradient(70% 50% at 100% 10%, rgba(62,235,165,0.12) 0%, rgba(62,235,165,0) 60%)",
        "nova-btn": "linear-gradient(135deg, #3EEBA5 0%, #22B27A 100%)",
        "nova-ai": "linear-gradient(135deg, #8B7CFF 0%, #5B8CFF 100%)",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 20px 60px -20px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(62,235,165,0.25), 0 0 40px -8px rgba(62,235,165,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        rise: "rise 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
