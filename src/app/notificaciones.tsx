import { ScreenHeader } from "@/components/ScreenHeader";
import { useNotificationSettings } from "@/contexts/notification-settings-context";
import { useTheme } from "@/contexts/theme-context";
import {
  getNotificationPermission,
  PermissionState,
  requestNotificationPermission,
  sendTestNotification,
} from "@/lib/notifications";
import WheelPicker from "@quidone/react-native-wheel-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: String(h).padStart(2, "0"),
}));
const MINUTES = Array.from({ length: 60 }, (_, m) => ({
  value: m,
  label: String(m).padStart(2, "0"),
}));

const PICKER_ITEM_HEIGHT = 34;
const PICKER_VISIBLE_ITEMS = 3;

const PERMISSION_LABEL: Record<PermissionState, string> = {
  granted: "Permitidas",
  denied: "Bloqueadas en los ajustes del teléfono",
  undetermined: "Aún no concedidas",
  unavailable: "No disponibles en esta versión de la app",
};

export default function NotificacionesScreen() {
  const { colors } = useTheme();
  const { enabled, defaultTime, setEnabled, setDefaultTime } =
    useNotificationSettings();
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  const refreshPermission = useCallback(() => {
    getNotificationPermission()
      .then(setPermission)
      .catch(() => setPermission("unavailable"));
  }, []);

  // Se vuelve a leer al regresar de los ajustes del teléfono.
  useEffect(() => {
    refreshPermission();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const [hour, minute] = useMemo(() => {
    const [h, m] = defaultTime.split(":").map(Number);
    return [Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0];
  }, [defaultTime]);

  const pickerItemTextStyle = {
    color: colors.white,
    fontFamily: "MomoTrustSans-Medium",
    fontSize: 15,
  };
  const pickerOverlayStyle = {
    backgroundColor: colors.accentSoft,
    borderRadius: 8,
  };

  const setTime = (h: number, m: number) =>
    setDefaultTime(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (value && permission === "undetermined") {
      setPermission(await requestNotificationPermission());
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestMessage("");
    try {
      const sent = await sendTestNotification();
      setTestMessage(
        sent
          ? "Listo: te llegará en unos 5 segundos."
          : "No se pudo enviar. Revisa que las notificaciones estén permitidas.",
      );
    } catch {
      setTestMessage("No se pudo enviar la notificación de prueba.");
    } finally {
      setTesting(false);
      refreshPermission();
    }
  };

  const blocked = permission === "denied";

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <ScreenHeader title="Notificaciones" />

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Activar */}
        <View className="bg-slate-800 rounded-lg px-4 py-3.5 flex-row items-center justify-between mb-2">
          <View className="flex-1 pr-4">
            <Text
              className="text-sm text-white mb-0.5"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Recordatorios de tareas
            </Text>
            <Text
              className="text-xs text-gray-400"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              Avisos a la hora de las tareas que tengan notificación.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.gray700, true: colors.accent }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Permiso del sistema */}
        <View className="bg-slate-800 rounded-lg px-4 py-3.5 mb-6">
          <Text
            className="text-sm text-white mb-0.5"
            style={{ fontFamily: "MomoTrustSans-Medium" }}
          >
            Permiso del teléfono
          </Text>
          <Text
            className={`text-xs ${blocked ? "text-red-500" : "text-gray-400"}`}
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {permission ? PERMISSION_LABEL[permission] : "Comprobando..."}
          </Text>
          {(blocked || permission === "undetermined") && (
            <TouchableOpacity
              className="self-start mt-3 px-3 py-2 rounded-lg bg-purple-500"
              onPress={async () => {
                if (blocked) await Linking.openSettings();
                else setPermission(await requestNotificationPermission());
              }}
            >
              <Text
                className="text-xs text-onaccent"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                {blocked ? "Abrir ajustes" : "Permitir notificaciones"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hora por defecto */}
        <Text
          className="text-sm text-gray-300 mb-2"
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          Hora sugerida al crear una tarea
        </Text>
        <TouchableOpacity
          className={`bg-slate-800 border rounded-lg px-3 py-2.5 mb-2 ${
            showPicker ? "border-purple-400" : "border-gray-700"
          }`}
          onPress={() => setShowPicker((v) => !v)}
        >
          <Text
            className="text-sm text-gray-100"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {defaultTime}
          </Text>
        </TouchableOpacity>

        {/* Se monta solo al abrirlo (visible), nunca dentro de un display:none. */}
        {showPicker && (
          <View className="flex-row justify-center items-center bg-slate-800 border border-gray-700 rounded-lg py-0.5 mb-6">
            <WheelPicker
              data={HOURS}
              value={hour}
              onValueChanged={({ item }) => setTime(item.value, minute)}
              itemHeight={PICKER_ITEM_HEIGHT}
              visibleItemCount={PICKER_VISIBLE_ITEMS}
              itemTextStyle={pickerItemTextStyle}
              overlayItemStyle={pickerOverlayStyle}
              width={64}
            />
            <Text
              className="text-lg text-gray-400 mx-1"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              :
            </Text>
            <WheelPicker
              data={MINUTES}
              value={minute}
              onValueChanged={({ item }) => setTime(hour, item.value)}
              itemHeight={PICKER_ITEM_HEIGHT}
              visibleItemCount={PICKER_VISIBLE_ITEMS}
              itemTextStyle={pickerItemTextStyle}
              overlayItemStyle={pickerOverlayStyle}
              width={64}
            />
          </View>
        )}
        {!showPicker && <View className="mb-4" />}

        {/* Prueba */}
        <TouchableOpacity
          className={`bg-slate-800 border border-gray-700 rounded-lg py-3 items-center ${
            testing ? "opacity-60" : ""
          }`}
          onPress={handleTest}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text
              className="text-sm text-purple-400"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              Enviar notificación de prueba
            </Text>
          )}
        </TouchableOpacity>
        {testMessage !== "" && (
          <Text
            className="text-xs text-gray-400 mt-2 text-center"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {testMessage}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
