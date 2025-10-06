/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4f46e5',
        'brand-secondary': '#06b6d4',
        // Dark mode color palette
        'dark-bg-primary': '#111827',
        'dark-bg-secondary': '#1f2937',
        'dark-bg-tertiary': '#374151',
        'dark-text-primary': '#f9fafb',
        'dark-text-secondary': '#d1d5db',
        'dark-text-tertiary': '#9ca3af',
        'dark-border-primary': '#374151',
        'dark-border-secondary': '#4b5563',
        'dark-hover': '#4b5563',
        'dark-active': '#6b7280',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}