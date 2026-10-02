export type TaskCategory = 'Personal' | 'Salud' | 'Casa' | 'Pareja';

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  time?: string; // HH:MM format
  dateStart?: string; // YYYY-MM-DD (vigencia; sin repeatDays es el único día)
  dateEnd?: string; // YYYY-MM-DD (fin de vigencia, solo aplica con repeatDays)
  repeatDays?: number[]; // 0=Mon..6=Sun
  createdAt: number;
  updatedAt: number;
}

// Registro de cumplimiento de una ocurrencia (tarea + día).
// Vive en users/{userId}/taskLogs/{taskId}_{YYYY-MM-DD}.
export interface TaskLog {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: number | null; // epoch ms
}

// completed: hecha | pending: hoy o futuro sin hacer | missed: día pasado sin hacer
export type OccurrenceStatus = 'completed' | 'pending' | 'missed';
