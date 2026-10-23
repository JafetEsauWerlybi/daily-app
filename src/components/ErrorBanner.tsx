import { useTheme } from "@/contexts/theme-context";
import { faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Text, TouchableOpacity, View } from "react-native";

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

// Aviso en línea para errores de Firestore; se cierra con la X.
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { colors } = useTheme();
  if (!message) return null;

  return (
    <View className="mx-5 mt-3 flex-row items-center rounded-lg border border-red-500 bg-slate-800 px-3 py-2.5">
      <FontAwesomeIcon icon={faTriangleExclamation} size={14} color="#ef4444" />
      <Text
        className="flex-1 mx-3 text-xs text-red-500"
        style={{ fontFamily: "MomoTrustSans-Medium" }}
      >
        {message}
      </Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={8}>
        <FontAwesomeIcon icon={faXmark} size={14} color={colors.gray500} />
      </TouchableOpacity>
    </View>
  );
}
