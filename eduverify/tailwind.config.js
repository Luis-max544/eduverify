/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--clr-accent)',
          muted:   'var(--clr-accent-muted)',
        },
        surface: {
          base:     'var(--clr-base)',
          DEFAULT:  'var(--clr-surface)',
          elevated: 'var(--clr-surface-elevated)',
        },
        content: {
          primary: 'var(--clr-text-primary)',
          muted:   'var(--clr-text-muted)',
        },
        premium: 'var(--clr-premium)',
      },
      fontFamily: {
        sans:    ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"SF Mono"', '"Fira Code"', '"Fira Mono"', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in':     { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-out-right': { '0%': { opacity: '1', transform: 'translateX(0)' }, '100%': { opacity: '0', transform: 'translateX(24px)' } },
      },
      animation: {
        'fade-in':        'fade-in 0.18s ease-out',
        'slide-in-right': 'slide-in-right 0.22s ease-out',
        'slide-out-right':'slide-out-right 0.2s ease-in forwards',
      },
    },
  },
  plugins: [],
}
