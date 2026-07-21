/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        plops: {
          blue: "#5b8cff",
          sky: "#7cd8ff",
          green: "#5fe3c0",
          mint: "#a8f5d8",
          pink: "#ff9ecd",
          rose: "#ffc4e1",
          ink: "#0c1330",
          night: "#070b1f",
        },
      },
      fontFamily: {
        display: ['"Clash Display"', '"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(124, 216, 255, 0.55)",
        "glow-pink": "0 0 50px -10px rgba(255, 158, 205, 0.6)",
        "glow-green": "0 0 50px -10px rgba(95, 227, 192, 0.55)",
        soft: "0 20px 60px -20px rgba(12, 19, 48, 0.35)",
      },
      backgroundImage: {
        "dreamy": "linear-gradient(135deg, #5b8cff 0%, #7cd8ff 30%, #5fe3c0 55%, #a8f5d8 70%, #ff9ecd 100%)",
        "dreamy-soft": "linear-gradient(120deg, rgba(124,216,255,0.25), rgba(95,227,192,0.2) 45%, rgba(255,158,205,0.25))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-30px) translateX(15px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        shimmer: "shimmer 8s ease infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
