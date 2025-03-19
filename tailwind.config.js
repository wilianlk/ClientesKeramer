/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Para que busque clases en el HTML
    "./src/**/*.{js,jsx,ts,tsx}", // Para que busque clases en tus archivos JS y JSX
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
