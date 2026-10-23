import { useAuth } from "@/contexts/auth-context";
import { useNotificationSettings } from "@/contexts/notification-settings-context";
import { useTaskLogs } from "@/hooks/use-task-logs";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useTasks } from "@/hooks/use-tasks";
import { subscribeToNotificationTaps } from "@/lib/notifications";
import { addDays, toDateStr } from "@/lib/task-schedule";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

// Misma ventana que programa lib/notifications (WINDOW_DAYS = 14).
const WINDOW_DAYS = 14;

// Sin UI: mantiene las notificaciones locales al día mientras hay sesión y abre la
// tarea en Hoy cuando el usuario toca una notificación.
export function NotificationSync() {
  const { user } = useAuth();
  const router = useRouter();
  const { enabled } = useNotificationSettings();
  const { tasks, loading } = useTasks(user?.uid);

  // "Hoy" se recalcula al volver a primer plano para no quedarse en el día anterior.
  const [today, setToday] = useState(() => toDateStr(new Date()));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setToday(toDateStr(new Date()));
    });
    return () => sub.remove();
  }, []);

  const lastDay = toDateStr(addDays(new Date(`${today}T00:00:00`), WINDOW_DAYS - 1));
  const { logs, isCompleted } = useTaskLogs(user?.uid, today, lastDay);

  useTaskNotifications(user?.uid, tasks, loading, enabled, isCompleted, logs);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotificationTaps((taskId) =>
      router.navigate({ pathname: "/(tabs)/hoy", params: { taskId } }),
    );
  }, [user, router]);

  return null;
}
