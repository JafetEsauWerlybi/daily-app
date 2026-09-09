import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Sí, salir',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/60 justify-center items-center px-8">
          <TouchableWithoutFeedback>
            <Animated.View
              style={{ opacity, transform: [{ scale }] }}
              className="w-full bg-slate-900 rounded-2xl border border-gray-700 px-6 py-6 items-center"
            >
              <View className="w-14 h-14 rounded-full bg-purple-500/20 justify-center items-center mb-4">
                <FontAwesomeIcon icon={faDoorOpen} size={22} color="#9184d9" />
              </View>

              <Text
                className="text-lg text-white mb-2 text-center"
                style={{ fontFamily: 'MomoTrustSans-SemiBold' }}
              >
                {title}
              </Text>
              <Text
                className="text-sm text-gray-400 mb-6 text-center"
                style={{ fontFamily: 'MomoTrustSans-Regular' }}
              >
                {message}
              </Text>

              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  className="flex-1 bg-slate-800 rounded-lg py-3 items-center border border-gray-700"
                  onPress={onCancel}
                >
                  <Text
                    className="text-gray-300 text-sm"
                    style={{ fontFamily: 'MomoTrustSans-Medium' }}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-purple-500 rounded-lg py-3 items-center"
                  onPress={onConfirm}
                >
                  <Text
                    className="text-white text-sm"
                    style={{ fontFamily: 'MomoTrustSans-SemiBold' }}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
