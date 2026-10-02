import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { TaskRow } from "@/components/TaskRow";
import { useAuth } from "@/contexts/auth-context";
import { useBackHandler } from "@/hooks/use-back-handler";
import { useTaskLogs } from "@/hooks/use-task-logs";
import { useTasks } from "@/hooks/use-tasks";
import {
  getOccurrenceStatus,
  getWeekDays,
  isTaskForDate,
  toDateStr,
} from "@/lib/task-schedule";
import {
  faChevronDown,
  faChevronRight,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export default function TableroScreen() {
  useBackHandler("tablero");
  const { user } = useAuth();

  const today = new Date();
  const todayStr = toDateStr(today);
  const weekDays = getWeekDays(today);
  const weekStart = toDateStr(weekDays[0]);
  const weekEnd = toDateStr(weekDays[6]);

  const tasksState = useTasks(user?.uid);
  const logsState = useTaskLogs(user?.uid, weekStart, weekEnd);
  const { tasks } = tasksState;
  const { isCompleted, setCompleted } = logsState;

  // Los días de hoy en adelante abren por defecto; los pasados, cerrados.
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [selected, setSelected] = useState<{
    taskId: string;
    day: string;
  } | null>(null);

  const syncing = tasksState.syncing || logsState.syncing;
  const handleSync = () => {
    tasksState.refresh();
    logsState.refresh();
  };

  const toggleDay = (day: string) => {
    setOpenOverrides((prev) => ({
      ...prev,
      [day]: !(prev[day] ?? day >= todayStr),
    }));
  };

  const selectedTask = selected
    ? (tasks.find((t) => t.id === selected.taskId) ?? null)
    : null;

  const first = weekDays[0];
  const last = weekDays[6];
  const rangeLabel =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()} – ${last.getDate()} ${MONTHS[last.getMonth()]}`
      : `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]}`;

  if (tasksState.loading || logsState.loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-950"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9184d9" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right"]}
    >
      <View className="px-5 py-4 border-b border-gray-700 flex-row items-center justify-between">
        <View>
          <Text
            className="text-3xl text-white mb-1"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Tablero
          </Text>
          <Text
            className="text-sm text-gray-400"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            Semana del {rangeLabel}
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-800 border border-gray-700 justify-center items-center"
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#9184d9" />
          ) : (
            <FontAwesomeIcon icon={faRotate} size={16} color="#9184d9" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
      >
        {weekDays.map((date, index) => {
          const day = toDateStr(date);
          const isPast = day < todayStr;
          const isToday = day === todayStr;
          const isOpen = openOverrides[day] ?? !isPast;
          const dayTasks = tasks.filter((t) => isTaskForDate(t, date));
          const doneCount = dayTasks.filter((t) =>
            isCompleted(t.id, day),
          ).length;

          return (
            <View key={day} className="mb-2">
              <TouchableOpacity
                className="flex-row items-center py-3 border-b border-gray-700"
                onPress={() => toggleDay(day)}
                activeOpacity={0.7}
              >
                <View className="w-5 items-center mr-2">
                  <FontAwesomeIcon
                    icon={isOpen ? faChevronDown : faChevronRight}
                    size={12}
                    color="#9ca3af"
                  />
                </View>
                <Text
                  className={`flex-1 text-base ${
                    isToday ? "text-purple-400" : "text-white"
                  }`}
                  style={{ fontFamily: "MomoTrustSans-SemiBold" }}
                >
                  {DAY_NAMES[index]} {date.getDate()}
                  {isToday ? " · Hoy" : ""}
                </Text>
                <Text
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "MomoTrustSans-Regular" }}
                >
                  {doneCount}/{dayTasks.length}
                </Text>
              </TouchableOpacity>

              {isOpen &&
                (dayTasks.length === 0 ? (
                  <Text
                    className="text-xs text-gray-500 py-3"
                    style={{ fontFamily: "MomoTrustSans-Regular" }}
                  >
                    Sin tareas
                  </Text>
                ) : (
                  dayTasks.map((task) => {
                    const completed = isCompleted(task.id, day);
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        status={getOccurrenceStatus(completed, day, todayStr)}
                        canToggle={!isPast}
                        onToggle={() => setCompleted(task.id, day, !completed)}
                        onPress={() => setSelected({ taskId: task.id, day })}
                      />
                    );
                  })
                ))}
            </View>
          );
        })}
      </ScrollView>

      <TaskDetailsModal
        task={selectedTask}
        status={
          selected
            ? getOccurrenceStatus(
                isCompleted(selected.taskId, selected.day),
                selected.day,
                todayStr,
              )
            : "pending"
        }
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}
