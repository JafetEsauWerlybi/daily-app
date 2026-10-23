import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Preferencias de notificaciones, guardadas solo en el dispositivo.
const STORAGE_KEY = "daily.notifications.v1";

export const DEFAULT_NOTIFY_TIME = "08:00";

interface NotificationSettings {
  enabled: boolean;
  defaultTime: string; // HH:MM, hora sugerida al crear una tarea con notificación
}

const DEFAULTS: NotificationSettings = {
  enabled: true,
  defaultTime: DEFAULT_NOTIFY_TIME,
};

interface ContextValue extends NotificationSettings {
  ready: boolean;
  setEnabled: (enabled: boolean) => void;
  setDefaultTime: (time: string) => void;
}

const NotificationSettingsContext = createContext<ContextValue | null>(null);

function parse(raw: string | null): NotificationSettings {
  if (!raw) return DEFAULTS;
  try {
    const data = JSON.parse(raw);
    return {
      enabled: data?.enabled !== false,
      defaultTime:
        typeof data?.defaultTime === "string" &&
        /^\d{2}:\d{2}$/.test(data.defaultTime)
          ? data.defaultTime
          : DEFAULT_NOTIFY_TIME,
    };
  } catch {
    return DEFAULTS;
  }
}

export function NotificationSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSettings(parse(raw)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);

  const setEnabled = useCallback(
    (enabled: boolean) => setSettings((prev) => ({ ...prev, enabled })),
    [],
  );
  const setDefaultTime = useCallback(
    (defaultTime: string) => setSettings((prev) => ({ ...prev, defaultTime })),
    [],
  );

  const value = useMemo<ContextValue>(
    () => ({ ...settings, ready, setEnabled, setDefaultTime }),
    [settings, ready, setEnabled, setDefaultTime],
  );

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useNotificationSettings(): ContextValue {
  const ctx = useContext(NotificationSettingsContext);
  if (!ctx) {
    throw new Error(
      "useNotificationSettings debe usarse dentro de NotificationSettingsProvider",
    );
  }
  return ctx;
}
