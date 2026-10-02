import { OccurrenceStatus, Task } from "@/types/task";

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Task.repeatDays usa 0=Lunes..6=Domingo; Date.getDay() usa 0=Domingo.
function repeatIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Tareas viejas sin dateStart: se usa el día de creación (si ya lo conocemos).
function startOf(task: Task): string | undefined {
  if (task.dateStart) return task.dateStart;
  const created = task.createdAt as unknown as { toDate?: () => Date } | null;
  return created?.toDate ? toDateStr(created.toDate()) : undefined;
}

export function isTaskForDate(task: Task, date: Date): boolean {
  const day = toDateStr(date);
  const start = startOf(task);
  if (!start) return false;

  const repeatDays = task.repeatDays ?? [];
  if (repeatDays.length === 0) return day === start;

  if (day < start) return false;
  if (task.dateEnd && day > task.dateEnd) return false;
  return repeatDays.includes(repeatIndex(date));
}

// Lunes..Domingo de la semana que contiene `date`.
export function getWeekDays(date: Date): Date[] {
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - repeatIndex(date),
  );
  return Array.from(
    { length: 7 },
    (_, i) =>
      new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
}

export function getOccurrenceStatus(
  completed: boolean,
  day: string,
  today: string,
): OccurrenceStatus {
  if (completed) return "completed";
  return day < today ? "missed" : "pending";
}

export function logId(taskId: string, day: string): string {
  return `${taskId}_${day}`;
}
