import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { useBackHandler } from '@/hooks/use-back-handler';

export default function CalendarioScreen() {
  useBackHandler('calendario');

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <View className="px-5 py-4 border-b border-gray-700">
        <Text className="text-3xl text-white" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
          Calendario
        </Text>
      </View>
      <View className="flex-1 justify-center items-center px-8">
        <FontAwesomeIcon icon={faCalendarDays} size={40} color="#9184d9" />
        <Text
          className="text-gray-400 text-base mt-4 text-center"
          style={{ fontFamily: 'MomoTrustSans-Regular' }}
        >
          Calendario en construcción
        </Text>
      </View>
    </SafeAreaView>
  );
}
