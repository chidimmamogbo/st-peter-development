/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a6f6",
          500: "#0c87eb",
          600: "#006ac9",
          700: "#0054a3",
          800: "#054786",
          900: "#0a3b6f",
          950: "#07264a",
        },
        navy: {
          800: "#111e38",
          900: "#0b1329",
          950: "#070b18",
        }
      }
    },
  },
  plugins: [],
};
