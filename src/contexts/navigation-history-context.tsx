import React, { createContext, useContext, useRef, useCallback } from 'react';

type TabName = 'hoy' | 'tablero' | 'calendario' | 'perfil';

interface NavigationHistoryContextValue {
  visitTab: (tab: TabName) => void;
  popTab: () => TabName | null;
  getHistory: () => TabName[];
}

const NavigationHistoryContext = createContext<NavigationHistoryContextValue | undefined>(undefined);

// Límite del historial en memoria: suficiente para cualquier sesión de uso normal
// sin dejar crecer el arreglo indefinidamente si el usuario cambia de tabs muchas veces.
const MAX_HISTORY_LENGTH = 50;

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  // Pila cronológica completa de tabs visitados (permite repeticiones no consecutivas,
  // ej. hoy -> tablero -> hoy -> tablero se registra completo, no se colapsa a 2 entradas).
  const historyRef = useRef<TabName[]>(['hoy']);

  const visitTab = useCallback((tab: TabName) => {
    const history = historyRef.current;
    // Solo evitamos duplicado si es exactamente la misma pantalla ya en el tope
    // (re-foco de la misma tab), pero SÍ permitimos que reaparezca más adelante en la pila.
    if (history[history.length - 1] === tab) return;

    history.push(tab);

    if (history.length > MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }
  }, []);

  const popTab = useCallback((): TabName | null => {
    const history = historyRef.current;
    if (history.length <= 1) return null;
    history.pop();
    return history[history.length - 1];
  }, []);

  const getHistory = useCallback(() => [...historyRef.current], []);

  return (
    <NavigationHistoryContext.Provider value={{ visitTab, popTab, getHistory }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const ctx = useContext(NavigationHistoryContext);
  if (!ctx) {
    throw new Error('useNavigationHistory debe usarse dentro de NavigationHistoryProvider');
  }
  return ctx;
}
