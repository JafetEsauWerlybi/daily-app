import { useAuth } from "@/contexts/auth-context";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useTasks } from "@/hooks/use-tasks";
import { useNotificationSettings } from "@/contexts/notification-settings-context";

// Sin UI: solo mantiene las notificaciones locales al día mientras hay sesión.
export function NotificationSync() {
  const { user } = useAuth();
  const { enabled } = useNotificationSettings();
  const { tasks, loading } = useTasks(user?.uid);
  useTaskNotifications(user?.uid, tasks, loading, enabled);
  return null;
}
