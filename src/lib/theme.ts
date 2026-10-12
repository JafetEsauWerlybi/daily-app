// Paletas y utilidades de color del tema (oscuro / claro + color de acento).
//
// Los colores de NativeWind (`bg-slate-950`, `text-gray-300`, `bg-purple-500`…)
// apuntan a variables CSS (`--c-*`, ver tailwind.config.ts). `buildTheme` genera
// el valor de esas variables para el modo y acento elegidos, y `colors` trae los
// mismos colores en hex para lo que no pasa por clases (iconos, placeholders…).

export type ThemeMode = "dark" | "light";

// Morado que ya usaba la app (bg-purple-500 de Tailwind).
export const DEFAULT_ACCENT = "#a855f7";

interface BasePalette {
  slate950: string; // fondo principal
  slate900: string;
  slate800: string; // tarjetas / inputs
  white: string; // texto principal
  gray100: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string; // bordes
  gray800: string;
  tabBar: string;
  tabBarBorder: string;
}

// Oscuro = exactamente los valores de Tailwind que ya se veían en la app.
const DARK: BasePalette = {
  slate950: "#020617",
  slate900: "#0f172a",
  slate800: "#1e293b",
  white: "#ffffff",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  tabBar: "#161826",
  tabBarBorder: "#333333",
};

const LIGHT: BasePalette = {
  slate950: "#f8fafc",
  slate900: "#f1f5f9",
  slate800: "#ffffff",
  white: "#0f172a",
  gray100: "#1e293b",
  gray300: "#334155",
  gray400: "#64748b",
  gray500: "#94a3b8",
  gray600: "#cbd5e1",
  gray700: "#d5dbe5",
  gray800: "#e2e8f0",
  tabBar: "#ffffff",
  tabBarBorder: "#e2e8f0",
};

// ---- Conversión de color ----------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

// Luminancia relativa (WCAG), 0 = negro, 1 = blanco.
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// h: 0-360, s y v: 0-1.
export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = v - c;
  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

// ---- Tema ------------------------------------------------------------------

export interface ThemeColors extends BasePalette {
  accent: string;
  // Acento para texto/bordes sobre el fondo (más claro en oscuro, más oscuro en claro).
  accentText: string;
  // Color de texto legible sobre un fondo de acento.
  onAccent: string;
  // Fondo translúcido del acento (sobre el que se resalta un item de rueda).
  accentSoft: string;
}

export interface BuiltTheme {
  colors: ThemeColors;
  // Valores "R G B" para las variables CSS que consume tailwind.config.ts.
  vars: Record<string, string>;
}

const rgbTriplet = (hex: string) => hexToRgb(hex).join(" ");

export function buildTheme(mode: ThemeMode, accent: string): BuiltTheme {
  const base = mode === "light" ? LIGHT : DARK;
  const accentText =
    mode === "light"
      ? mix(accent, "#000000", 0.3)
      : mix(accent, "#ffffff", 0.25);
  const onAccent = luminance(accent) > 0.4 ? "#0f172a" : "#ffffff";
  const [ar, ag, ab] = hexToRgb(accent);

  const colors: ThemeColors = {
    ...base,
    accent,
    accentText,
    onAccent,
    accentSoft: `rgba(${ar}, ${ag}, ${ab}, 0.14)`,
  };

  const vars: Record<string, string> = {
    "--c-slate-950": rgbTriplet(base.slate950),
    "--c-slate-900": rgbTriplet(base.slate900),
    "--c-slate-800": rgbTriplet(base.slate800),
    "--c-white": rgbTriplet(base.white),
    "--c-gray-100": rgbTriplet(base.gray100),
    "--c-gray-300": rgbTriplet(base.gray300),
    "--c-gray-400": rgbTriplet(base.gray400),
    "--c-gray-500": rgbTriplet(base.gray500),
    "--c-gray-600": rgbTriplet(base.gray600),
    "--c-gray-700": rgbTriplet(base.gray700),
    "--c-gray-800": rgbTriplet(base.gray800),
    "--c-accent": rgbTriplet(accent),
    "--c-accent-text": rgbTriplet(accentText),
    "--c-on-accent": rgbTriplet(onAccent),
  };

  return { colors, vars };
}
