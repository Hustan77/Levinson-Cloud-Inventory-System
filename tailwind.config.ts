import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/components/ui/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0D13"
        }
      },
      boxShadow: {
        glass: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -8px 24px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.45)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 20px rgba(0,255,255,0.16)"
      },
      borderRadius: {
        slab: "20px"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(.2,.8,.2,1)"
      },
      backgroundImage: {
        "vignette":
          "radial-gradient(1200px 600px at 50% 0%, rgba(255,255,255,0.05), transparent), radial-gradient(1200px 600px at 50% 100%, rgba(0,0,0,0.35), transparent)",
        "micro-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        "grid-size": "20px 20px"
      },
      ringColor: {
        neon: "#22d3ee"
      }
    }
  },
  plugins: []
};

export default config;
