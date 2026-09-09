export type TaskCategory = 'Personal' | 'Salud' | 'Casa' | 'Pareja';

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  time?: string; // HH:MM format
  done: boolean;
  completedAt?: number; // epoch ms
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string; // YYYY-MM-DD
  repeatDays?: number[]; // 0=Mon..6=Sun
  createdAt: number;
  updatedAt: number;
}
