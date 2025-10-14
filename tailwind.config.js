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
        'brand-primary': '#2563eb',
        'brand-secondary': '#0891b2',
        'brand-accent': '#059669',
        // Light mode optimized palette
        'light-bg-primary': '#ffffff',
        'light-bg-secondary': '#f9fafb',
        'light-bg-tertiary': '#f3f4f6',
        'light-bg-hover': '#e5e7eb',
        'light-text-primary': '#111827',
        'light-text-secondary': '#374151',
        'light-text-tertiary': '#6b7280',
        'light-border': '#d1d5db',
        'light-border-light': '#e5e7eb',
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