import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBell,
  faPalette,
  faUserGear,
  faShieldHalved,
  faCircleQuestion,
  faRightFromBracket,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/auth-context';
import { useLoading } from '@/contexts/loading-context';
import { useBackHandler } from '@/hooks/use-back-handler';

const MENU_ITEMS = [
  { label: 'Notificaciones', icon: faBell },
  { label: 'Apariencia', icon: faPalette },
  { label: 'Cuenta', icon: faUserGear },
  { label: 'Privacidad', icon: faShieldHalved },
  { label: 'Ayuda', icon: faCircleQuestion },
];

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { show: showLoading } = useLoading();
  useBackHandler('perfil');

  const handleLogout = async () => {
    try {
      showLoading();
      await logout();
    } catch (error) {}
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-700">
        <Text className="text-3xl text-white" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
          Perfil
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6">
        {/* Avatar Card */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-purple-500 justify-center items-center mb-4">
            <Text className="text-2xl text-white" style={{ fontFamily: 'MomoTrustSans-Bold' }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className="text-lg text-white mb-1" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
            {user?.displayName || user?.email || 'Usuario'}
          </Text>
          <Text className="text-sm text-gray-400" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
            {user?.email}
          </Text>
        </View>

        {/* Menu */}
        <View className="gap-2">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="bg-slate-800 rounded-lg px-4 py-3.5 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <FontAwesomeIcon icon={item.icon} size={16} color="#9184d9" />
                <Text className="text-sm text-gray-300" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
                  {item.label}
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} size={14} color="#666" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            className="bg-slate-800 rounded-lg px-4 py-3.5 flex-row justify-between items-center mt-4"
            onPress={handleLogout}
          >
            <View className="flex-row items-center gap-3">
              <FontAwesomeIcon icon={faRightFromBracket} size={16} color="#c084fc" />
              <Text className="text-sm text-purple-400" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
                Cerrar sesión
              </Text>
            </View>
            <FontAwesomeIcon icon={faChevronRight} size={14} color="#c084fc" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
