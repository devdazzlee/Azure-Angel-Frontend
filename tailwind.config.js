/** @type {import('tailwindcss').Config} */
module.exports = {
  // Without this, Tailwind's default 'media' strategy activates every
  // shadcn/ui primitive's `dark:` classes based on the OS/browser
  // `prefers-color-scheme`, even though this app has no dark theme (only
  // one :root color block, no .dark overrides) and no theme toggle. On any
  // system set to dark mode, that silently swapped in unstyled dark-mode
  // colors (e.g. near-black `--foreground` text) across buttons, tabs,
  // switches, inputs, etc. — exactly the "active tab text unreadable" bug.
  // 'class' scopes dark: to an explicit .dark class this app never adds,
  // so those variants stay inert and the intended light theme always renders.
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'landing-display': ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        landing: {
          navy: 'var(--landing-navy)',
          'navy-deep': 'var(--landing-navy-deep)',
          cream: 'var(--landing-cream)',
          sky: 'var(--landing-sky)',
        },
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'gradient': 'gradient 3s ease infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        '300%': '300% 100%',
      },
    },
  },
  plugins: [],
}