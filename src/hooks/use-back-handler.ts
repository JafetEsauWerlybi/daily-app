import { useState, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigationHistory } from '@/contexts/navigation-history-context';

type TabName = 'hoy' | 'tablero' | 'calendario' | 'perfil';

/**
 * Hook para manejar el botón de regresar del teléfono dentro de los tabs.
 * Usa el historial de navegación por sesión: si hay un tab previo, navega hacia
 * él; si ya está en 'hoy' sin historial, expone un modal de confirmación para salir.
 */
export function useBackHandler(screenName: TabName) {
  const router = useRouter();
  const { visitTab, popTab } = useNavigationHistory();
  const [exitModalVisible, setExitModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      visitTab(screenName);
    }, [screenName, visitTab])
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        const previousTab = popTab();

        if (previousTab) {
          router.navigate(`/(tabs)/${previousTab}` as any);
          return true;
        }

        if (screenName === 'hoy') {
          setExitModalVisible(true);
          return true;
        }

        router.navigate('/(tabs)/hoy' as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [screenName, router, popTab])
  );

  const confirmExit = useCallback(() => {
    BackHandler.exitApp();
  }, []);

  const cancelExit = useCallback(() => {
    setExitModalVisible(false);
  }, []);

  return { exitModalVisible, confirmExit, cancelExit };
}
