import React, { useEffect, useState } from "react";
import { View, Text, Animated } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, type, visible, onHide, duration = 3000 }: ToastProps) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, opacity, duration, onHide]);

  if (!visible) return null;

  const bgColor = type === "success" ? "bg-emerald-600" : "bg-red-600";
  const icon = type === "success" ? faCheck : faXmark;

  return (
    <Animated.View
      className={`absolute top-20 left-0 right-0 ${bgColor} px-6 py-4 mx-4 rounded-lg flex-row items-center`}
      style={{ opacity, zIndex: 9999 }}
    >
      <FontAwesomeIcon icon={icon} size={20} color="#fff" />
      <Text className="text-white flex-1 ml-3" style={{ fontFamily: "MomoTrustSans-SemiBold" }}>
        {message}
      </Text>
    </Animated.View>
  );
}
