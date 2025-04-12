module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1', // indigo-600
        secondary: '#4F46E5', // indigo-700
        background: '#F9FAFB', // gray-50
      },
    },
  },
  plugins: [],
}