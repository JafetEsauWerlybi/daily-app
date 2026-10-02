import { MONTHS } from "@/constants/dates";
import { countTasksInMonth } from "@/lib/task-schedule";
import { Task } from "@/types/task";
import { Text, TouchableOpacity, View } from "react-native";

const COLUMNS = 3;

interface YearGridProps {
  year: number;
  tasks: Task[];
  today: Date;
  onSelectMonth: (month: number) => void;
}

export function YearGrid({ year, tasks, today, onSelectMonth }: YearGridProps) {
  // 4 filas de 3 tarjetas que se reparten todo el alto disponible.
  const rows = Array.from({ length: MONTHS.length / COLUMNS }, (_, r) =>
    MONTHS.slice(r * COLUMNS, r * COLUMNS + COLUMNS),
  );

  return (
    <View className="flex-1 px-4 py-2">
      {rows.map((row, r) => (
        <View key={r} className="flex-1 flex-row">
          {row.map((name, c) => {
            const month = r * COLUMNS + c;
            const count = countTasksInMonth(tasks, year, month);
            const isCurrent =
              today.getFullYear() === year && today.getMonth() === month;
            return (
              <TouchableOpacity
                key={name}
                className="flex-1 m-2 bg-slate-800 rounded-xl items-center justify-center border border-gray-700"
                onPress={() => onSelectMonth(month)}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-base mb-1 ${
                    isCurrent ? "text-purple-400" : "text-white"
                  }`}
                  style={{ fontFamily: "MomoTrustSans-SemiBold" }}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
                <Text
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {count === 0
                    ? "Sin tareas"
                    : `${count} ${count === 1 ? "tarea" : "tareas"}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
