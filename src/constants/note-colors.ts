import { NoteColorKey } from "@/types/note";

// Colores de las notas. Se pintan como un tinte translúcido sobre el fondo de la
// tarjeta (sufijo de alfa en hex), así se leen bien en tema claro y oscuro.
export const NOTE_COLORS: { key: NoteColorKey; hex: string | null; label: string }[] = [
  { key: "none", hex: null, label: "Sin color" },
  { key: "yellow", hex: "#facc15", label: "Amarillo" },
  { key: "orange", hex: "#fb923c", label: "Naranja" },
  { key: "red", hex: "#f87171", label: "Rojo" },
  { key: "green", hex: "#4ade80", label: "Verde" },
  { key: "blue", hex: "#60a5fa", label: "Azul" },
  { key: "purple", hex: "#a78bfa", label: "Morado" },
  { key: "pink", hex: "#f472b6", label: "Rosa" },
];

export function noteColorHex(key: NoteColorKey): string | null {
  return NOTE_COLORS.find((c) => c.key === key)?.hex ?? null;
}

// Fondo y borde de una nota con color, o null si no tiene.
export function noteTint(key: NoteColorKey): { backgroundColor: string; borderColor: string } | null {
  const hex = noteColorHex(key);
  return hex ? { backgroundColor: `${hex}33`, borderColor: `${hex}80` } : null;
}
