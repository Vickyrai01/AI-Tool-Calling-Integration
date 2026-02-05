import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f8fafc',
        border: '#e5e7eb',
        text: '#111827',
        muted: '#6b7280',
        primary: '#2563eb',
        user: '#e6f3ff',
        assistant: '#f7f7f7',
      },
    },
  },
  plugins: [],
};

export default config;