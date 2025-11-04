/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}"  // 👈 this line now includes ALL folders (root, components, hooks, etc.)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
