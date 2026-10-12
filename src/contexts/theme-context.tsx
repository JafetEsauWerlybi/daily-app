import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars } from "nativewind";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View } from "react-native";

import {
  buildTheme,
  DEFAULT_ACCENT,
  ThemeColors,
  ThemeMode,
} from "@/lib/theme";

// Preferencias de apariencia, guardadas solo en el dispositivo.
const STORAGE_KEY = "daily.appearance.v1";

interface Appearance {
  mode: ThemeMode;
  accent: string;
}

const DEFAULT_APPEARANCE: Appearance = { mode: "dark", accent: DEFAULT_ACCENT };

interface ThemeContextValue extends Appearance {
  colors: ThemeColors;
  isLight: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseAppearance(raw: string | null): Appearance {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const data = JSON.parse(raw);
    const mode: ThemeMode = data?.mode === "light" ? "light" : "dark";
    const accent =
      typeof data?.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(data.accent)
        ? data.accent
        : DEFAULT_ACCENT;
    return { mode, accent };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);

  // Carga lo guardado antes de pintar, para no mostrar un destello del tema por
  // defecto cuando el usuario eligió otro.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setAppearance(parseAppearance(raw)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appearance)).catch(
      () => {},
    );
  }, [appearance, ready]);

  const theme = useMemo(
    () => buildTheme(appearance.mode, appearance.accent),
    [appearance],
  );

  const setMode = useCallback(
    (mode: ThemeMode) => setAppearance((prev) => ({ ...prev, mode })),
    [],
  );
  const setAccent = useCallback(
    (accent: string) => setAppearance((prev) => ({ ...prev, accent })),
    [],
  );
  const reset = useCallback(() => setAppearance(DEFAULT_APPEARANCE), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...appearance,
      colors: theme.colors,
      isLight: appearance.mode === "light",
      setMode,
      setAccent,
      reset,
    }),
    [appearance, theme, setMode, setAccent, reset],
  );

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>
      {/* `vars` redefine las variables CSS (--c-*) para todo el árbol de abajo. */}
      <View
        style={[
          { flex: 1, backgroundColor: theme.colors.slate950 },
          vars(theme.vars),
        ]}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de AppThemeProvider");
  return ctx;
}
