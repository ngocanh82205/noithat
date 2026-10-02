import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: "#FDFBF7",
        charcoal: "#121212",
        espresso: "#1A1A1A",
        gold: "#D4AF37",
        champagne: "#E6D5B8",
        // Tông gỗ & cát dùng ở ví xu, affiliate, gian hàng (trước đây chưa khai báo nên không hiển thị)
        sand: "#E8DCC4",
        wood: {
          DEFAULT: "#6B4A32",
          dark: "#3E2A1C",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      boxShadow: {
        ambient: "0 30px 80px -20px rgba(18, 18, 18, 0.18)",
        "ambient-lg": "0 60px 140px -40px rgba(18, 18, 18, 0.28)",
        "gold-glow": "0 0 0 1px rgba(212, 175, 55, 0.35)",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "gold-line":
          "linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
