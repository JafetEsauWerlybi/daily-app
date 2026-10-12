import type { Config } from 'tailwindcss';

// Los colores que usa la app apuntan a variables CSS (`--c-*`) que define el
// tema en runtime (src/lib/theme.ts → buildTheme, aplicado con `vars()` en
// src/contexts/theme-context.tsx). Así las clases existentes (`bg-slate-950`,
// `text-gray-300`, `bg-purple-500`…) cambian con el modo claro/oscuro y el acento.
// El valor por defecto de cada variable (modo oscuro) está en src/global.css.
const c = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        slate: { 950: c('slate-950'), 900: c('slate-900'), 800: c('slate-800') },
        gray: {
          100: c('gray-100'),
          300: c('gray-300'),
          400: c('gray-400'),
          500: c('gray-500'),
          600: c('gray-600'),
          700: c('gray-700'),
          800: c('gray-800'),
        },
        // Texto principal: blanco en oscuro, casi negro en claro.
        white: c('white'),
        // Acento elegido por el usuario (antes morado fijo).
        purple: { 400: c('accent-text'), 500: c('accent') },
        // Texto sobre un fondo de acento (blanco u oscuro según el contraste).
        onaccent: c('on-accent'),
        // Blanco fijo para texto sobre colores que no cambian (etiquetas, toast).
        pure: '#ffffff',
      },
    },
  },
  plugins: [],
} satisfies Config;
