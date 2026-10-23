import { ScreenHeader } from "@/components/ScreenHeader";
import { useTheme } from "@/contexts/theme-context";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCloud,
  faMobileScreen,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS: { icon: IconDefinition; title: string; items: string[] }[] = [
  {
    icon: faCloud,
    title: "Lo que se guarda en tu cuenta",
    items: [
      "Tu nombre y correo.",
      "Tus tareas: título, etiqueta, fechas, días de repetición y hora de aviso.",
      "El registro de qué tareas marcaste como completadas y en qué día.",
      "Todo se guarda en Firebase (Google), ligado a tu cuenta.",
    ],
  },
  {
    icon: faMobileScreen,
    title: "Lo que se queda solo en tu teléfono",
    items: [
      "Tu tema y color de acento.",
      "Tus ajustes de notificaciones.",
      "Los recordatorios se programan en el propio teléfono; no pasan por ningún servidor.",
    ],
  },
  {
    icon: faUserShield,
    title: "Quién puede ver tus datos",
    items: [
      "Cada usuario solo puede leer y modificar sus propias tareas y registros; las reglas de Firestore lo bloquean para el resto.",
      "Tu contraseña la administra Firebase Authentication; la app nunca la guarda.",
    ],
  },
];

export default function PrivacidadScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Privacidad" />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-sm text-gray-400 mb-6"
          style={{ fontFamily: "MomoTrustSans-Regular" }}
        >
          Así maneja Daily! tu información.
        </Text>

        {SECTIONS.map((section) => (
          <View
            key={section.title}
            className="bg-slate-800 rounded-lg px-4 py-4 mb-3"
          >
            <View className="flex-row items-center gap-3 mb-3">
              <FontAwesomeIcon
                icon={section.icon}
                size={16}
                color={colors.accent}
              />
              <Text
                className="flex-1 text-sm text-white"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                {section.title}
              </Text>
            </View>
            {section.items.map((item) => (
              <View key={item} className="flex-row mb-1.5">
                <Text className="text-gray-400 text-xs mr-2">•</Text>
                <Text
                  className="flex-1 text-xs text-gray-300"
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
