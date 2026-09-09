import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/contexts/auth-context';
import { useLoading } from '@/contexts/loading-context';
import { View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { hide: hideLoading } = useLoading();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
      if (user) {
        hideLoading();
        router.navigate('/(tabs)/hoy');
      } else {
        hideLoading();
        router.navigate('/auth/login');
      }
    }
  }, [user, loading, router, hideLoading]);

  return <View style={{ flex: 1, backgroundColor: '#161826' }} />;
}
