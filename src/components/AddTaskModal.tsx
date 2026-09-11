import { CATEGORY_COLORS, TASK_CATEGORIES } from "@/constants/categories";
import { TaskCategory } from "@/types/task";
import WheelPicker, { DatePicker } from "@quidone/react-native-wheel-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: String(h).padStart(2, "0"),
}));
const MINUTES = Array.from({ length: 60 }, (_, m) => ({
  value: m,
  label: String(m).padStart(2, "0"),
}));

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseTimeStr(str: string): { hour: number; minute: number } {
  const [h, m] = str.split(":").map(Number);
  return {
    hour: Number.isFinite(h) ? h : 12,
    minute: Number.isFinite(m) ? m : 0,
  };
}

const PICKER_ITEM_HEIGHT = 34;
const PICKER_VISIBLE_ITEMS = 3;

const pickerItemTextStyle = {
  color: "#e9e9ed",
  fontFamily: "MomoTrustSans-Medium",
  fontSize: 15,
};
const pickerOverlayStyle = {
  backgroundColor: "rgba(145, 132, 217, 0.12)",
  borderRadius: 8,
};

export interface AddTaskData {
  title: string;
  category: TaskCategory;
  time?: string;
  dateStart?: string;
  dateEnd?: string;
  repeatDays?: number[];
}

interface AddTaskModalProps {
  visible: boolean;
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (task: AddTaskData) => void;
}

export function AddTaskModal({
  visible,
  initialTitle = "",
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<TaskCategory>("Personal");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [time, setTime] = useState("");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [activeDatePicker, setActiveDatePicker] = useState<
    "start" | "end" | null
  >(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { hour: selectedHour, minute: selectedMinute } = useMemo(
    () => parseTimeStr(time),
    [time],
  );

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
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
      translateY.setValue(400);
      opacity.setValue(0);
    }
  }, [visible, initialTitle, translateY, opacity]);

  const resetForm = () => {
    setTitle("");
    setCategory("Personal");
    setDateStart("");
    setDateEnd("");
    setTime("");
    setRepeatDays([]);
    setActiveDatePicker(null);
    setShowTimePicker(false);
  };

  const toggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const allDaysSelected = repeatDays.length === 7;
  const toggleAllDays = () => {
    setRepeatDays(allDaysSelected ? [] : [0, 1, 2, 3, 4, 5, 6]);
  };

  const openDatePicker = (field: "start" | "end") => {
    setActiveDatePicker((prev) => (prev === field ? null : field));
  };

  const setHour = (hour: number) => {
    setTime(
      `${String(hour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`,
    );
  };

  const setMinute = (minute: number) => {
    setTime(
      `${String(selectedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (!title.trim()) return;
    console.log({
      title: title.trim(),
      category,
      time: time || undefined,
      dateStart: dateStart || undefined,
      dateEnd: dateEnd || undefined,
      repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
    });
    // onSubmit({
    //   title: title.trim(),
    //   category,
    //   time: time || undefined,
    //   dateStart: dateStart || undefined,
    //   dateEnd: dateEnd || undefined,
    //   repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
    // });
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end">
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            className="absolute inset-0 bg-black/50"
            style={{ opacity }}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          className="bg-slate-950 rounded-t-2xl border-t border-x border-gray-700 px-5 pt-4"
          style={{
            maxHeight: "88%",
            paddingBottom: insets.bottom,
            transform: [{ translateY }],
          }}
        >
          <View className="w-10 h-1.5 bg-gray-700 rounded-full self-center mb-4" />

          <Text
            className="text-xl text-white mb-4"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Nueva tarea
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            style={{ flexGrow: 1, flexShrink: 1 }}
          >
            {/* Título */}
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Título
            </Text>
            <TextInput
              className="bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm mb-4"
              placeholder="¿Qué necesitas hacer?"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            />

            {/* Etiqueta */}
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Etiqueta
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {TASK_CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className="px-3 py-1.5 rounded-lg border-2"
                    style={{
                      borderColor: selected
                        ? CATEGORY_COLORS[cat]
                        : "transparent",
                      backgroundColor: CATEGORY_COLORS[cat],
                      opacity: selected ? 1 : 0.5,
                    }}
                  >
                    <Text
                      className="text-xs text-white"
                      style={{ fontFamily: "MomoTrustSans-Medium" }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rango de fechas */}
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Rango de fechas
            </Text>
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                className={`flex-1 bg-slate-800 border rounded-lg px-3 py-2.5 ${
                  activeDatePicker === "start"
                    ? "border-purple-400"
                    : "border-gray-700"
                }`}
                onPress={() => openDatePicker("start")}
              >
                <Text
                  className={
                    dateStart
                      ? "text-sm text-gray-100"
                      : "text-sm text-gray-500"
                  }
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {dateStart || "Inicio"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 bg-slate-800 border rounded-lg px-3 py-2.5 ${
                  activeDatePicker === "end"
                    ? "border-purple-400"
                    : "border-gray-700"
                }`}
                onPress={() => openDatePicker("end")}
              >
                <Text
                  className={
                    dateEnd ? "text-sm text-gray-100" : "text-sm text-gray-500"
                  }
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {dateEnd || "Fin"}
                </Text>
              </TouchableOpacity>
            </View>

            {activeDatePicker && (
              <View className="bg-slate-800 border border-gray-700 rounded-lg py-0.5 mb-2 items-center">
                <DatePicker
                  date={
                    (activeDatePicker === "start" ? dateStart : dateEnd) ||
                    toDateStr(new Date())
                  }
                  onDateChanged={({ date }) => {
                    if (activeDatePicker === "start") setDateStart(date);
                    if (activeDatePicker === "end") setDateEnd(date);
                  }}
                  locale="es-MX"
                  itemHeight={PICKER_ITEM_HEIGHT}
                  visibleItemCount={PICKER_VISIBLE_ITEMS}
                  itemTextStyle={pickerItemTextStyle}
                  overlayItemStyle={pickerOverlayStyle}
                />
              </View>
            )}

            {/* Hora de notificación */}
            <Text
              className="text-sm text-gray-300 mb-2"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Hora de notificación
            </Text>
            <TouchableOpacity
              className={`bg-slate-800 border rounded-lg px-3 py-2.5 mb-2 ${
                showTimePicker ? "border-purple-400" : "border-gray-700"
              }`}
              onPress={() => setShowTimePicker((prev) => !prev)}
            >
              <Text
                className={
                  time ? "text-sm text-gray-100" : "text-sm text-gray-500"
                }
                style={{ fontFamily: "MomoTrustSans-Regular" }}
              >
                {time || "Sin recordatorio"}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <View className="flex-row justify-center items-center bg-slate-800 border border-gray-700 rounded-lg py-0.5 mb-4">
                <WheelPicker
                  data={HOURS}
                  value={selectedHour}
                  onValueChanged={({ item }) => setHour(item.value)}
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
                  value={selectedMinute}
                  onValueChanged={({ item }) => setMinute(item.value)}
                  itemHeight={PICKER_ITEM_HEIGHT}
                  visibleItemCount={PICKER_VISIBLE_ITEMS}
                  itemTextStyle={pickerItemTextStyle}
                  overlayItemStyle={pickerOverlayStyle}
                  width={64}
                />
              </View>
            )}

            {/* Días que se realizará */}
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-sm text-gray-300"
                style={{ fontFamily: "MomoTrustSans-Medium" }}
              >
                Días que se realizará
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={toggleAllDays}
              >
                <View
                  className={`w-4 h-4 rounded border-2 justify-center items-center ${
                    allDaysSelected
                      ? "bg-purple-500 border-purple-500"
                      : "border-gray-600"
                  }`}
                >
                  {allDaysSelected && (
                    <Text
                      className="text-white text-[10px]"
                      style={{ fontFamily: "MomoTrustSans-Bold" }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  Todos los días
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 mb-6">
              {DAY_LABELS.map((label, index) => {
                const selected = repeatDays.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleRepeatDay(index)}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Acciones */}
          <View className="flex-row gap-3 pt-3">
            <TouchableOpacity
              className="flex-1 bg-slate-800 rounded-lg py-3 items-center border border-gray-700"
              onPress={handleClose}
            >
              <Text
                className="text-gray-300 text-sm"
                style={{ fontFamily: "MomoTrustSans-Medium" }}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-purple-500 rounded-lg py-3 items-center"
              onPress={handleSave}
            >
              <Text
                className="text-white text-sm"
                style={{ fontFamily: "MomoTrustSans-SemiBold" }}
              >
                Guardar
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
