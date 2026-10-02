import { TaskRow } from "@/components/TaskRow";
import { DAY_NAMES, MONTHS } from "@/constants/dates";
import {
  getOccurrenceStatus,
  isTaskForDate,
  toDateStr,
} from "@/lib/task-schedule";
import { Task } from "@/types/task";
import { ScrollView, Text, View } from "react-native";

interface DayTaskListProps {
  date: Date;
  tasks: Task[];
  todayStr: string;
  isCompleted: (taskId: string, day: string) => boolean;
  setCompleted: (taskId: string, day: string, completed: boolean) => void;
  onSelectTask: (taskId: string) => void;
}

export function DayTaskList({
  date,
  tasks,
  todayStr,
  isCompleted,
  setCompleted,
  onSelectTask,
}: DayTaskListProps) {
  const day = toDateStr(date);
  const isPast = day < todayStr;
  const dayTasks = tasks.filter((t) => isTaskForDate(t, date));
  const weekdayIndex = (date.getDay() + 6) % 7;

  return (
    <View className="flex-1 border-t border-gray-700">
      <Text
        className="text-base text-white px-5 pt-3 pb-1"
        style={{ fontFamily: "MomoTrustSans-SemiBold" }}
      >
        {DAY_NAMES[weekdayIndex]} {date.getDate()} de {MONTHS[date.getMonth()]}
      </Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        {dayTasks.length === 0 ? (
          <Text
            className="text-xs text-gray-500 py-3"
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          >
            Sin tareas este día.
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
                onPress={() => onSelectTask(task.id)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
