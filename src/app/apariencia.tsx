import { ColorWheel } from "@/components/ColorWheel";
import { useTheme } from "@/contexts/theme-context";
import { DEFAULT_ACCENT, ThemeMode } from "@/lib/theme";
import { faArrowLeft, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MODES: { key: ThemeMode; label: string; icon: IconDefinition }[] = [
  { key: "dark", label: "Oscuro", icon: faMoon },
  { key: "light", label: "Claro", icon: faSun },
];

export default function AparienciaScreen() {
  const router = useRouter();
  const { mode, accent, colors, setMode, setAccent, reset } = useTheme();
  // Mientras se arrastra la rueda se frena el scroll para que no compita.
  const [dragging, setDragging] = useState(false);

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-row items-center px-6 py-4 border-b border-gray-700">
        <TouchableOpacity
          className="mr-4"
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.white} />
        </TouchableOpacity>
        <Text
          className="text-3xl text-white"
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        >
          Apariencia
        </Text>
      </View>

      <ScrollView
        scrollEnabled={!dragging}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tema */}
        <Text
          className="text-sm text-gray-300 mb-3"
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          Tema
        </Text>
        <View className="flex-row gap-3 mb-8">
          {MODES.map((m) => {
            const selected = mode === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMode(m.key)}
                className={`flex-1 bg-slate-800 rounded-lg py-4 items-center border-2 ${
                  selected ? "border-purple-500" : "border-gray-700"
                }`}
              >
                <FontAwesomeIcon
                  icon={m.icon}
                  size={22}
                  color={selected ? colors.accent : colors.gray400}
                />
                <Text
                  className={`text-sm mt-2 ${
                    selected ? "text-white" : "text-gray-400"
                  }`}
                  style={{ fontFamily: "MomoTrustSans-Medium" }}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Color de acento */}
        <Text
          className="text-sm text-gray-300 mb-3"
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          Color de acento
        </Text>
        <View className="bg-slate-800 border border-gray-700 rounded-lg py-6 items-center">
          <ColorWheel
            value={accent}
            onChange={setAccent}
            onInteraction={setDragging}
          />

          <View className="flex-row items-center mt-5">
            <View
              className="w-8 h-8 rounded-full mr-3"
              style={{ backgroundColor: accent }}
            />
            <Text
              className="text-sm text-gray-100"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              {accent.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Vista previa */}
        <Text
          className="text-sm text-gray-300 mt-8 mb-3"
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          Vista previa
        </Text>
        <View className="bg-slate-800 border border-gray-700 rounded-lg p-4">
          <Text
            className="text-base text-purple-400 mb-3"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Así se verá tu acento
          </Text>
          <View className="bg-purple-500 rounded-lg py-3 items-center">
            <Text
              className="text-sm text-onaccent"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              Botón principal
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className={`bg-slate-800 border border-gray-700 rounded-lg py-3 items-center mt-6 ${
            mode === "dark" && accent === DEFAULT_ACCENT ? "opacity-40" : ""
          }`}
          onPress={reset}
          disabled={mode === "dark" && accent === DEFAULT_ACCENT}
        >
          <Text
            className="text-sm text-gray-300"
            style={{ fontFamily: "MomoTrustSans-Medium" }}
          >
            Restablecer valores
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
