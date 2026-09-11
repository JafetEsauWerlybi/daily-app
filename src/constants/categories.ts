import { TaskCategory } from '@/types/task';

export const TASK_CATEGORIES: TaskCategory[] = ['Personal', 'Salud', 'Casa', 'Pareja'];

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Personal: '#9184d9',
  Salud: '#ff6b6b',
  Casa: '#4ecdc4',
  Pareja: '#ffe66d',
};
