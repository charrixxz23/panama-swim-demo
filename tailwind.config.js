/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`;
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("bg"),
        surface: c("surface"),
        raised: c("raised"),
        ink: c("ink"),
        muted: c("muted"),
        line: c("line"),
        brand: c("brand"),
        accent: c("accent"),
        signal: c("signal"),
        ok: c("ok"),
        navy: "#07182F",
        ocean: "#0969B2",
        pool: "#00B7E8",
        mist: "#F2F6FA",
        flag: "#D62839",
      },
      fontFamily: {
        display: ['"Saira Variable"', "Saira", "system-ui", "sans-serif"],
        sans: ['"Figtree Variable"', "Figtree", "system-ui", "sans-serif"],
      },
      maxWidth: { site: "82rem", prose: "40rem" },
      screens: { xs: "420px" },
    },
  },
  plugins: [],
};
