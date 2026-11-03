import { useTheme } from "@/contexts/theme-context";
import { faWifi } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

const DELAY_MS = 2500;

// Aviso discreto cuando los datos vienen de la caché local (sin conexión con el
// servidor). Se espera DELAY_MS para no parpadear en el arranque normal, donde el
// primer snapshot también llega "desde caché" unos instantes.
export function OfflineBanner({ fromCache }: { fromCache: boolean }) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!fromCache) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [fromCache]);

  if (!show) return null;

  return (
    <View className="mx-5 mt-3 flex-row items-center rounded-lg border border-gray-700 bg-slate-800 px-3 py-2.5">
      <FontAwesomeIcon icon={faWifi} size={14} color={colors.gray500} />
      <Text
        className="flex-1 mx-3 text-xs text-gray-300"
        style={{ fontFamily: "MomoTrustSans-Medium" }}
      >
        Sin conexión. Tus cambios se guardan en el teléfono y se sincronizarán al reconectar.
      </Text>
    </View>
  );
}
