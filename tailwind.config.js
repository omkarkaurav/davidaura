module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Ensures Tailwind scans all components
  theme: {
    extend: {}, // Allows custom theme extensions
  },
  plugins: [], // Ensure this is correctly placed inside the object
};
