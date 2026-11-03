import { useTheme } from "@/contexts/theme-context";
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { disableNetwork, enableNetwork } from "@react-native-firebase/firestore";
import { db } from "@/lib/firebase";
import { SafeAreaView } from "react-native-safe-area-context";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBell,
  faPalette,
  faUserGear,
  faShieldHalved,
  faCircleQuestion,
  faRightFromBracket,
  faChevronRight,
  faPlugCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Href, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useLoading } from "@/contexts/loading-context";
import { useBackHandler } from "@/hooks/use-back-handler";

const MENU_ITEMS: {
  label: string;
  icon: IconDefinition;
  route: Href;
}[] = [
  { label: "Notificaciones", icon: faBell, route: "/notificaciones" },
  { label: "Apariencia", icon: faPalette, route: "/apariencia" },
  { label: "Cuenta", icon: faUserGear, route: "/cuenta" },
  { label: "Privacidad", icon: faShieldHalved, route: "/privacidad" },
  { label: "Ayuda", icon: faCircleQuestion, route: "/ayuda" },
];

export default function PerfilScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { show: showLoading } = useLoading();
  useBackHandler("perfil");

  // Solo desarrollo: simula "sin internet" en Firestore sin apagar el Wi-Fi, que
  // Metro necesita para cargar el código en el APK de desarrollo.
  const [simulateOffline, setSimulateOffline] = useState(false);
  const toggleSimulatedOffline = async () => {
    try {
      if (simulateOffline) await enableNetwork(db);
      else await disableNetwork(db);
      setSimulateOffline(!simulateOffline);
    } catch (err) {
      console.warn("[offline-dev] no se pudo cambiar la red de Firestore:", err);
    }
  };

  const handleLogout = async () => {
    try {
      showLoading();
      await logout();
    } catch (error) {}
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-700">
        <Text
          className="text-3xl text-white"
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        >
          Perfil
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6">
        {/* Avatar Card */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-purple-500 justify-center items-center mb-4">
            <Text
              className="text-2xl text-onaccent"
              style={{ fontFamily: "MomoTrustSans-Bold" }}
            >
              {user?.email?.[0].toUpperCase() || "U"}
            </Text>
          </View>
          <Text
            className="text-lg text-white mb-1"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            {user?.displayName || user?.email || "Usuario"}
          </Text>
          <Text
            className="text-sm text-gray-400"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {user?.email}
          </Text>
        </View>

        {/* Menu */}
        <View className="gap-2">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="bg-slate-800 rounded-lg px-4 py-3.5 flex-row justify-between items-center"
              onPress={() => router.navigate(item.route)}
            >
              <View className="flex-row items-center gap-3">
                <FontAwesomeIcon
                  icon={item.icon}
                  size={16}
                  color={colors.accent}
                />
                <Text
                  className="text-sm text-gray-300"
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {item.label}
                </Text>
              </View>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={14}
                color={colors.gray500}
              />
            </TouchableOpacity>
          ))}

          {__DEV__ && (
            <TouchableOpacity
              className="bg-slate-800 rounded-lg px-4 py-3.5 flex-row justify-between items-center mt-4 border border-gray-700"
              onPress={toggleSimulatedOffline}
            >
              <View className="flex-row items-center gap-3">
                <FontAwesomeIcon
                  icon={faPlugCircleXmark}
                  size={16}
                  color={simulateOffline ? "#ef4444" : colors.accent}
                />
                <Text
                  className="text-sm text-gray-300"
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {simulateOffline
                    ? "Sin internet simulado: ACTIVO (tocar para quitar)"
                    : "Simular sin internet (solo desarrollo)"}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-slate-800 rounded-lg px-4 py-3.5 flex-row justify-between items-center mt-4"
            onPress={handleLogout}
          >
            <View className="flex-row items-center gap-3">
              <FontAwesomeIcon
                icon={faRightFromBracket}
                size={16}
                color={colors.accentText}
              />
              <Text
                className="text-sm text-purple-400"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Cerrar sesión
              </Text>
            </View>
            <FontAwesomeIcon
              icon={faChevronRight}
              size={14}
              color={colors.accentText}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
