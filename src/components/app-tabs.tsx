import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#9184d9',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#161826',
          borderTopColor: '#333',
          borderTopWidth: 1,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="(hoy)"
        options={{
          title: 'Hoy',
          tabBarLabel: 'Hoy',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />

      <Tabs.Screen
        name="(tablero)"
        options={{
          title: 'Tablero',
          tabBarLabel: 'Tablero',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />

      <Tabs.Screen
        name="(calendario)"
        options={{
          title: 'Calendario',
          tabBarLabel: 'Calendario',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />

      <Tabs.Screen
        name="(perfil)"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
