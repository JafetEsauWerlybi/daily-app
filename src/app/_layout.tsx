import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import '@/global.css';
import { AuthProvider } from '@/contexts/auth-context';
import { LoadingProvider } from '@/contexts/loading-context';
import { NavigationHistoryProvider } from '@/contexts/navigation-history-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'MomoTrustSans-Regular': require('../../assets/fonts/MomoTrustSans-Regular.ttf'),
          'MomoTrustSans-Medium': require('../../assets/fonts/MomoTrustSans-Medium.ttf'),
          'MomoTrustSans-SemiBold': require('../../assets/fonts/MomoTrustSans-SemiBold.ttf'),
          'MomoTrustSans-Bold': require('../../assets/fonts/MomoTrustSans-Bold.ttf'),
        });
      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    loadFonts();
  }, []);

  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <AuthProvider>
          <NavigationHistoryProvider>
            <ThemeProvider value={DarkTheme}>
              <StatusBar style="light" translucent backgroundColor="transparent" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animationEnabled: true,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </ThemeProvider>
          </NavigationHistoryProvider>
        </AuthProvider>
      </LoadingProvider>
    </SafeAreaProvider>
  );
}
