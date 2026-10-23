import { MONTHS } from "@/constants/dates";

// "14:30" si es de hoy, "12 oct" si es de este año, "12 oct 2025" si no.
export function formatNoteDate(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  const month = MONTHS[date.getMonth()].slice(0, 3);
  return date.getFullYear() === now.getFullYear()
    ? `${date.getDate()} ${month}`
    : `${date.getDate()} ${month} ${date.getFullYear()}`;
}
