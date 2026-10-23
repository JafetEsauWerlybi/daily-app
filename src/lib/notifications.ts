import type * as NotificationsModule from "expo-notifications";
import { Platform } from "react-native";
import { addDays, isTaskForDate, toDateStr } from "@/lib/task-schedule";
import { Task } from "@/types/task";

// En Expo Go para Android (desde SDK 53) falta ExpoTopicSubscriptionModule y
// `import "expo-notifications"` lanza al evaluarse, tumbando toda la app. Se carga
// con require dentro de try/catch: en Expo Go las notificaciones quedan apagadas y
// en un development build / APK funcionan normal.
let Notifications: typeof NotificationsModule | null = null;
try {
  Notifications = require("expo-notifications");
} catch (err) {
  console.warn(
    "[notif] expo-notifications no está disponible en este entorno (¿Expo Go en Android?). Usa un development build para probar notificaciones.",
  );
}

export const notificationsAvailable = Notifications !== null;

const CHANNEL_ID = "tasks";
// Días hacia adelante que se programan. Se re-sincroniza al abrir la app, así
// que la ventana "avanza" sola. Evita triggers semanales, que no respetan dateEnd.
const WINDOW_DAYS = 14;
// iOS solo conserva 64 notificaciones locales pendientes.
const MAX_SCHEDULED = 60;

// Mostrar la notificación también con la app abierta.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(N: typeof NotificationsModule) {
  if (Platform.OS !== "android") return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Recordatorios de tareas",
    importance: N.AndroidImportance.HIGH,
  });
}

// Pide permiso solo si aún no se decidió. Devuelve si se puede notificar.
async function ensurePermission(N: typeof NotificationsModule): Promise<boolean> {
  // En Android 13+ el prompt solo aparece si ya existe un canal.
  await ensureChannel(N);
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await N.requestPermissionsAsync();
  return next.granted;
}

export type PermissionState =
  | "granted"
  | "denied"
  | "undetermined"
  | "unavailable";

// Estado del permiso del sistema, sin pedirlo.
export async function getNotificationPermission(): Promise<PermissionState> {
  if (!Notifications) return "unavailable";
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  return current.canAskAgain ? "undetermined" : "denied";
}

// Pide el permiso desde Ajustes. Devuelve el estado resultante.
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!Notifications) return "unavailable";
  const granted = await ensurePermission(Notifications);
  return granted ? "granted" : getNotificationPermission();
}

// Notificación de prueba a los 5 segundos, para comprobar que todo funciona.
export async function sendTestNotification(): Promise<boolean> {
  if (!Notifications) return false;
  if (!(await ensurePermission(Notifications))) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily!",
      body: "Así se verán tus recordatorios de tareas.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

export type SyncResult =
  | { status: "unavailable" }
  | { status: "no-tasks" }
  | { status: "denied" }
  | { status: "ok"; scheduled: number };

export async function cancelTaskNotifications() {
  await Notifications?.cancelAllScheduledNotificationsAsync();
}

// Deja programadas exactamente las notificaciones de las tareas con hora para
// los próximos WINDOW_DAYS días: cancela todo y vuelve a programar.
export async function syncTaskNotifications(tasks: Task[]): Promise<SyncResult> {
  const N = Notifications;
  if (!N) return { status: "unavailable" };
  const withTime = tasks.filter((t) => !!t.time);
  if (withTime.length === 0) {
    await cancelTaskNotifications();
    return { status: "no-tasks" };
  }
  if (!(await ensurePermission(N))) return { status: "denied" };

  const now = new Date();
  const pending: { task: Task; when: Date }[] = [];

  for (let i = 0; i < WINDOW_DAYS; i++) {
    const day = addDays(now, i);
    for (const task of withTime) {
      if (!isTaskForDate(task, day)) continue;
      const [h, m] = (task.time as string).split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
      const when = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        h,
        m,
      );
      if (when.getTime() <= now.getTime()) continue;
      pending.push({ task, when });
    }
  }

  pending.sort((a, b) => a.when.getTime() - b.when.getTime());

  await cancelTaskNotifications();
  const toSchedule = pending.slice(0, MAX_SCHEDULED);
  for (const { task, when } of toSchedule) {
    await N.scheduleNotificationAsync({
      identifier: `${task.id}_${toDateStr(when)}`,
      content: {
        title: task.title,
        body: `Tienes una tarea de ${task.category} programada para las ${task.time}`,
        data: { taskId: task.id },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: CHANNEL_ID,
      },
    });
  }
  return { status: "ok", scheduled: toSchedule.length };
}
