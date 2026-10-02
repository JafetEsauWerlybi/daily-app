import { Text, TouchableOpacity, View } from "react-native";

export type CalendarMode = "week" | "month" | "year";

const OPTIONS: { key: CalendarMode; label: string }[] = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

interface CalendarModeSwitchProps {
  mode: CalendarMode;
  onChange: (mode: CalendarMode) => void;
}

export function CalendarModeSwitch({
  mode,
  onChange,
}: CalendarModeSwitchProps) {
  return (
    <View className="flex-row bg-slate-800 border border-gray-700 rounded-lg p-1 mx-5 mt-3">
      {OPTIONS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          className={`flex-1 py-2 rounded-md items-center ${
            mode === key ? "bg-purple-500" : ""
          }`}
          onPress={() => onChange(key)}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm ${mode === key ? "text-white" : "text-gray-400"}`}
            style={{ fontFamily: "MomoTrustSans-Medium" }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
