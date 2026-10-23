import { useTheme } from "@/contexts/theme-context";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

// Encabezado de las pantallas de Perfil: flecha para volver + título.
export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
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
        {title}
      </Text>
    </View>
  );
}
