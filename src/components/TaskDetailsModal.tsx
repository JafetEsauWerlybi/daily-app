import { CATEGORY_COLORS } from "@/constants/categories";
import { OccurrenceStatus, Task } from "@/types/task";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  completed: "Completada",
  pending: "Pendiente",
  missed: "No completada",
};

interface TaskDetailsModalProps {
  task: Task | null;
  // Estado de la ocurrencia que se está viendo (la tarea en sí no tiene estado).
  status?: OccurrenceStatus;
  onClose: () => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text
        className="text-xs text-gray-400 mb-1"
        style={{ fontFamily: "MomoTrustSans-Medium" }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

export function TaskDetailsModal({
  task,
  status = "pending",
  onClose,
}: TaskDetailsModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  // Conserva la última tarea mostrada para que el contenido no desaparezca
  // durante la animación de cierre.
  const [shown, setShown] = useState<Task | null>(null);
  const visible = task !== null;

  useEffect(() => {
    if (task) setShown(task);
  }, [task]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 300,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, translateY, opacity]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!mounted || !shown) return null;

  const color = CATEGORY_COLORS[shown.category] || "#9184d9";
  const hasRange = !!(shown.dateStart || shown.dateEnd);
  const repeatDays = shown.repeatDays ?? [];

  return (
    <View
      className="absolute inset-0 justify-end"
      style={{ elevation: 20, zIndex: 20 }}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={{ opacity }}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        className="bg-slate-950 rounded-t-2xl border-t border-x border-gray-700 px-5 pt-4"
        style={{
          paddingBottom: insets.bottom + 12,
          transform: [{ translateY }],
        }}
      >
        <View className="w-10 h-1.5 bg-gray-700 rounded-full self-center mb-4" />

        <Text
          className="text-xl text-white mb-1"
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        >
          {shown.title}
        </Text>
        <View className="flex-row items-center gap-2 mb-5">
          <View
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: color }}
          >
            <Text
              className="text-[11px] text-white"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              {shown.category}
            </Text>
          </View>
          <Text
            className="text-xs text-gray-400"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {STATUS_LABELS[status]}
          </Text>
        </View>

        <Row label="Notificación">
          <Text
            className="text-sm text-gray-100"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {shown.time ?? "Sin notificación"}
          </Text>
        </Row>

        <Row label="Fechas">
          <Text
            className="text-sm text-gray-100"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            {hasRange
              ? `${shown.dateStart ?? "—"}  →  ${shown.dateEnd ?? "—"}`
              : "Sin fecha"}
          </Text>
        </Row>

        <Row label="Días que se realiza">
          {repeatDays.length === 0 ? (
            <Text
              className="text-sm text-gray-100"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              No se repite
            </Text>
          ) : (
            <View className="flex-row gap-2">
              {DAY_LABELS.map((label, index) => {
                const selected = repeatDays.includes(index);
                return (
                  <View
                    key={index}
                    className={`w-9 h-9 rounded-full border-2 justify-center items-center ${
                      selected
                        ? "bg-purple-500 border-purple-500"
                        : "border-gray-700"
                    }`}
                  >
                    <Text
                      className={
                        selected
                          ? "text-white text-xs"
                          : "text-gray-400 text-xs"
                      }
                      style={{ fontFamily: "MomoTrustSans-Medium" }}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Row>

        <TouchableOpacity
          className="bg-slate-800 rounded-lg py-3 items-center border border-gray-700 mt-2"
          onPress={onClose}
        >
          <Text
            className="text-gray-300 text-sm"
            style={{ fontFamily: "MomoTrustSans-Medium" }}
          >
            Cerrar
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
