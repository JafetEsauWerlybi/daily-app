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

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export interface MonthCell {
  date: Date;
  inMonth: boolean;
}

// Semanas completas (lunes primero) que cubren el mes: 4 a 6 filas. Solo se
// incluyen los días vecinos necesarios para completar la primera y última semana.
export function getMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1);
  const offset = repeatIndex(first);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const start = addDays(first, -offset);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, inMonth: date.getMonth() === month };
  });
}

// Cantidad de tareas distintas con al menos una ocurrencia en el mes.
export function countTasksInMonth(
  tasks: Task[],
  year: number,
  month: number,
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return tasks.filter((task) => {
    for (let d = 1; d <= daysInMonth; d++) {
      if (isTaskForDate(task, new Date(year, month, d))) return true;
    }
    return false;
  }).length;
}

export interface DayCounts {
  total: number;
  done: number;
}

export function countDay(
  tasks: Task[],
  date: Date,
  isCompleted: (taskId: string, day: string) => boolean,
): DayCounts {
  const day = toDateStr(date);
  let total = 0;
  let done = 0;
  for (const task of tasks) {
    if (!isTaskForDate(task, date)) continue;
    total++;
    if (isCompleted(task.id, day)) done++;
  }
  return { total, done };
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
