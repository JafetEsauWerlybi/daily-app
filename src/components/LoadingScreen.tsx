import React, { useEffect, useState } from "react";
import { View, Animated, Text } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

interface LoadingScreenProps {
  visible: boolean;
}

export function LoadingScreen({ visible }: LoadingScreenProps) {
  const [opacity] = useState(new Animated.Value(0));
  const [rotation] = useState(new Animated.Value(0));
  const [textOpacity] = useState(new Animated.Value(0.5));

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Continuous rotation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Text pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity, rotation, textOpacity]);

  if (!visible) {
    return null;
  }


  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      className="absolute inset-0 bg-slate-950 items-center justify-center"
      style={{
        opacity,
        zIndex: 9999,
      }}
    >
      <Animated.View
        style={{
          transform: [{ rotate: rotateInterpolate }],
        }}
      >
        <FontAwesomeIcon icon={faSpinner} size={48} color="#a78bfa" />
      </Animated.View>

      <Animated.View
        style={{
          marginTop: 24,
          opacity: textOpacity,
        }}
      >
        <Text
          className="text-gray-300 text-base"
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          Cargando...
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
