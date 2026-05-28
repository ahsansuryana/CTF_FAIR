import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0d0d10',
        'bg-surface': '#16161a',
        'bg-elevated': '#1e1e24',
        'bg-muted': '#252530',
        'border-subtle': '#2a2a35',
        'border-default': '#3a3a48',
        'border-strong': '#52526a',
        'text-primary': '#f0f0f5',
        'text-secondary': '#a0a0b8',
        'text-muted': '#787898',
        'text-disabled': '#3a3a50',
        accent: '#d4820a',
        'accent-hover': '#e8950f',
        'accent-subtle': 'rgba(212, 130, 10, 0.12)',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        'solved-bg': 'rgba(34, 197, 94, 0.08)',
        'solved-border': 'rgba(34, 197, 94, 0.3)',
        'category-web': '#3b82f6',
        'category-crypto': '#a855f7',
        'category-forensics': '#f59e0b',
        'category-stegano': '#22c55e',
        'category-osint': '#ef4444',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      spacing: {
        sidebar: '240px',
        'sidebar-collapsed': '64px',
      },
      maxWidth: {
        content: '1200px',
      },
      borderRadius: {
        card: '8px',
        button: '6px',
        badge: '4px',
      },
      boxShadow: {
        'accent-glow': '0 0 0 3px rgba(212, 130, 10, 0.12)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      transitionDuration: {
        micro: '150ms',
        transition: '250ms',
        appear: '350ms',
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'solved-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
        },
        'flash-highlight': {
          '0%': { backgroundColor: 'rgba(212, 130, 10, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'spinner': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 350ms ease-out',
        'solved-pulse': 'solved-pulse 2s ease-out',
        'flash-highlight': 'flash-highlight 1s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'spinner': 'spinner 1s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
