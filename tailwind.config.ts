import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        ink: { DEFAULT: "#0B0907", 2: "#141008", 3: "#1E1810", 4: "#2A221A", 5: "#3A3028" },
        gold: { DEFAULT: "#F5A623", light: "#FFD080", dim: "rgba(245,166,35,0.12)" },
        cream: { DEFAULT: "#F0EAD6", dim: "#B8AE98" },
        muted: "#6B6354",
        saffron: "#F5A623",
        paper: "#FDFBF7",
        border: "rgba(11,9,7,0.1)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease both",
        "fade-in": "fadeIn 0.5s ease both",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        "marquee-rev": "marqueeRev 36s linear infinite",
        draw: "draw 1.4s ease 0.4s both",
        shimmer: "shimmer 3s linear infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(28px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        marqueeRev: { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        draw: { from: { strokeDashoffset: "100" }, to: { strokeDashoffset: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [typography],
};

export default config;
