import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faListCheck,
  faTableCellsLarge,
  faCalendarDays,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'MomoTrustSans-Medium',
          fontSize: 11,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="hoy"
        options={{
          title: 'Hoy',
          tabBarLabel: 'Hoy',
          tabBarIcon: ({ color }) => <FontAwesomeIcon icon={faListCheck} size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="tablero"
        options={{
          title: 'Tablero',
          tabBarLabel: 'Tablero',
          tabBarIcon: ({ color }) => <FontAwesomeIcon icon={faTableCellsLarge} size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarLabel: 'Calendario',
          tabBarIcon: ({ color }) => <FontAwesomeIcon icon={faCalendarDays} size={20} color={color} />,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesomeIcon icon={faUser} size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
