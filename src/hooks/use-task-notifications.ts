import { useEffect, useRef } from "react";
import { Alert, AppState, Linking } from "react-native";
import { cancelTaskNotifications, syncTaskNotifications } from "@/lib/notifications";
import { Task } from "@/types/task";

// Mantiene sincronizadas las notificaciones locales con las tareas del usuario.
// Se vuelve a ejecutar al cambiar las tareas y cada vez que la app vuelve a primer
// plano (para mover la ventana de días programados).
export function useTaskNotifications(
  userId: string | undefined,
  tasks: Task[],
  loading: boolean,
) {
  // Avisar del permiso denegado una sola vez por sesión.
  const warnedDenied = useRef(false);

  useEffect(() => {
    if (!userId) {
      cancelTaskNotifications().catch(() => {});
      return;
    }
    if (loading) return;

    const run = () => {
      syncTaskNotifications(tasks)
        .then((result) => {
          if (result.status !== "denied" || warnedDenied.current) return;
          warnedDenied.current = true;
          Alert.alert(
            "Notificaciones desactivadas",
            "Para recibir recordatorios de tus tareas activa las notificaciones de la app en los ajustes del teléfono.",
            [
              { text: "Ahora no", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
            ],
          );
        })
        .catch((err) => console.warn("[notif] error sincronizando:", err));
    };

    run();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => sub.remove();
  }, [userId, tasks, loading]);
}
