/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bl: {
          orange: "#F36F21",
          dark: "#D55A12",
          deep: "#B8470A",
          yellow: "#FDB913",
          ink: "#16161D",
          slate: "#5B5B66",
          mist: "#F6F7FB",
          line: "#E7E8EF",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,16,29,.06), 0 8px 24px rgba(16,16,29,.06)",
        pop: "0 10px 40px rgba(16,16,29,.16)",
      },
    },
  },
  plugins: [],
};
