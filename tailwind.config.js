/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        paper: "rgb(var(--rgb-paper) / <alpha-value>)",
        surface: "rgb(var(--rgb-surface) / <alpha-value>)",
        ink: "rgb(var(--rgb-ink) / <alpha-value>)",
        ink2: "rgb(var(--rgb-ink2) / <alpha-value>)",
        brand: "rgb(var(--rgb-brand) / <alpha-value>)",
        sage: "rgb(var(--rgb-brand-soft) / <alpha-value>)",
        tangerine: "rgb(var(--rgb-tangerine) / <alpha-value>)",
        line: "rgb(var(--rgb-line) / <alpha-value>)",
        gold: "rgb(var(--rgb-gold) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
    },
  },
  plugins: [],
};
