import { useAuth } from "@/contexts/auth-context";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useTasks } from "@/hooks/use-tasks";

// Sin UI: solo mantiene las notificaciones locales al día mientras hay sesión.
export function NotificationSync() {
  const { user } = useAuth();
  const { tasks, loading } = useTasks(user?.uid);
  useTaskNotifications(user?.uid, tasks, loading);
  return null;
}
