/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'max-1400': { 'max': '1400px' },
        'max-1200': { 'max': '1200px' },
        'max-768': { 'max': '768px' },
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        'pulse-simple': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'typing-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        loading: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        pulse: 'pulse 2s infinite',
        'pulse-simple': 'pulse-simple 2s infinite',
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        'typing-bounce': 'typing-bounce 1.4s infinite ease-in-out',
        loading: 'loading 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
