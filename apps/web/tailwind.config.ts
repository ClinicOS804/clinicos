import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:   { DEFAULT: '#00c896', dark: '#00b386', light: '#e6faf5' },
        app:     '#f0f4f8',
        sidebar: '#1e293b',
        card:    '#ffffff',
        subtle:  '#f8fafc',
        primary: '#1e293b',
        muted:   '#64748b',
        faint:   '#94a3b8',
        border:  '#e2e8f0',
        'blue-light':   '#eff6ff',
        'amber-light':  '#fffbeb',
        'danger-light': '#fef2f2',
        'purple-light': '#ede9fe',
        'success-light':'#dcfce7',
        danger:  '#ef4444',
        success: '#16a34a',
        amber:   '#f59e0b',
        purple:  '#7c3aed',
      },
      borderRadius: { card: '14px', btn: '10px', input: '10px', chip: '999px' },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card:       '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 12px 0 rgba(0,0,0,0.08)',
        modal:      '0 20px 60px rgba(0,0,0,0.18)',
      },
      animation: {
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-up':       'slideUp 0.25s ease-out',
        'fade-in':        'fadeIn 0.15s ease-out',
        'pop-in':         'popIn 0.2s ease-out',
      },
      keyframes: {
        slideInRight: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideUp:      { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        popIn:        { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
