import type { Config } from 'tailwindcss';
const v = (n: string) => `var(--tp-${n})`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', "[data-theme='dark']"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      colors: {
        brand: { DEFAULT: v('brand'), soft: v('brand-soft'), strong: v('brand-strong') },
        teal: { DEFAULT: v('teal'), soft: v('teal-soft') },
        bgapp: v('bg-app'),
        bgmap: v('bg-map'),
        bgpanel: v('bg-panel'),
        bgpanelsoft: v('bg-panel-soft'),
        bgpanelhover: v('bg-panel-hover'),
        bgtooltip: v('bg-tooltip'),
        bd: v('border'),
        bdstrong: v('border-strong'),
        bdfocus: v('border-focus'),
        tp: v('text'),
        tpmuted: v('text-muted'),
        tpsubtle: v('text-subtle'),
        tponaccent: v('text-on-accent'),
        jam0: v('jam-0'),
        jam1: v('jam-1'),
        jam2: v('jam-2'),
        jam3: v('jam-3'),
        jam4: v('jam-4'),
        jam5: v('jam-5'),
        incaccident: v('inc-accident'),
        incaccidentsoft: v('inc-accident-soft'),
        incworks: v('inc-works'),
        incworkssoft: v('inc-works-soft'),
        incclosure: v('inc-closure'),
        incclosuresoft: v('inc-closure-soft'),
        inccamera: v('inc-camera'),
        inccamerasoft: v('inc-camera-soft'),
        incweather: v('inc-weather'),
        incweathersoft: v('inc-weather-soft'),
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        pill: '999px',
      },
      boxShadow: {
        sm: v('shadow-sm'),
        md: v('shadow-md'),
        lg: v('shadow-lg'),
      },
      keyframes: {
        pulseLive: {
          '0%,100%': { boxShadow: '0 0 0 3px currentColor' },
          '50%': { boxShadow: '0 0 0 6px currentColor' },
        },
        haloPulse: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.7', transform: 'scale(1.08)' },
        },
      },
      animation: {
        'live-pulse': 'pulseLive 2s infinite',
        'halo-pulse': 'haloPulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
