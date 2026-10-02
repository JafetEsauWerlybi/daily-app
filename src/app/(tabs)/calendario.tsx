import {
  CalendarMode,
  CalendarModeSwitch,
} from "@/components/calendar/CalendarModeSwitch";
import { DayTaskList } from "@/components/calendar/DayTaskList";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekStrip } from "@/components/calendar/WeekStrip";
import { YearGrid } from "@/components/calendar/YearGrid";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { MONTHS } from "@/constants/dates";
import { useAuth } from "@/contexts/auth-context";
import { useBackHandler } from "@/hooks/use-back-handler";
import { useTaskLogs } from "@/hooks/use-task-logs";
import { useTasks } from "@/hooks/use-tasks";
import {
  addDays,
  countDay,
  getMonthGrid,
  getOccurrenceStatus,
  getWeekDays,
  toDateStr,
} from "@/lib/task-schedule";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Mismo día del mes en `target`, ajustado a su último día; hoy si cae en ese mes.
function pickDayInMonth(target: Date, today: Date, current: Date): Date {
  if (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth()
  ) {
    return today;
  }
  const daysInMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(current.getDate(), daysInMonth),
  );
}

export default function CalendarioScreen() {
  useBackHandler("calendario");
  const { user } = useAuth();

  const today = new Date();
  const todayStr = toDateStr(today);

  // Siempre abre en Semana con hoy seleccionado.
  const [mode, setMode] = useState<CalendarMode>("week");
  const [anchor, setAnchor] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [selectedTask, setSelectedTask] = useState<{
    taskId: string;
    day: string;
  } | null>(null);

  const weekDays = getWeekDays(anchor);
  const monthCells = getMonthGrid(anchor.getFullYear(), anchor.getMonth());

  // Rango de logs según lo visible; Año solo cuenta tareas, no necesita logs.
  const [logFrom, logTo] =
    mode === "week"
      ? [toDateStr(weekDays[0]), toDateStr(weekDays[6])]
      : mode === "month"
        ? [
            toDateStr(monthCells[0].date),
            toDateStr(monthCells[monthCells.length - 1].date),
          ]
        : [todayStr, todayStr];

  const { tasks, loading: tasksLoading } = useTasks(user?.uid);
  const {
    isCompleted,
    setCompleted,
    loading: logsLoading,
  } = useTaskLogs(user?.uid, logFrom, logTo);

  const getCounts = (date: Date) => countDay(tasks, date, isCompleted);

  const shift = (dir: 1 | -1) => {
    if (mode === "week") {
      setAnchor(addDays(anchor, 7 * dir));
      setSelectedDay(addDays(selectedDay, 7 * dir));
    } else if (mode === "month") {
      const target = new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
      setAnchor(target);
      setSelectedDay(pickDayInMonth(target, today, selectedDay));
    } else {
      setAnchor(new Date(anchor.getFullYear() + dir, anchor.getMonth(), 1));
    }
  };

  const changeMode = (next: CalendarMode) => {
    if (next !== "year") setAnchor(selectedDay);
    setMode(next);
  };

  const goToToday = () => {
    setAnchor(today);
    setSelectedDay(today);
  };

  const selectMonthFromYear = (month: number) => {
    const target = new Date(anchor.getFullYear(), month, 1);
    setAnchor(target);
    setSelectedDay(pickDayInMonth(target, today, target));
    setMode("month");
  };

  const rangeLabel = (() => {
    if (mode === "year") return String(anchor.getFullYear());
    if (mode === "month") {
      return `${capitalize(MONTHS[anchor.getMonth()])} ${anchor.getFullYear()}`;
    }
    const first = weekDays[0];
    const last = weekDays[6];
    return first.getMonth() === last.getMonth()
      ? `${first.getDate()} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
      : `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
  })();

  const isOnToday =
    toDateStr(selectedDay) === todayStr &&
    (mode !== "year" || anchor.getFullYear() === today.getFullYear()) &&
    (mode !== "month" ||
      (anchor.getFullYear() === today.getFullYear() &&
        anchor.getMonth() === today.getMonth()));

  const detailTask = selectedTask
    ? (tasks.find((t) => t.id === selectedTask.taskId) ?? null)
    : null;

  if (tasksLoading || logsLoading) {
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
      <View className="px-5 py-4 flex-row items-center justify-between">
        <Text
          className="text-3xl text-white"
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        >
          Calendario
        </Text>
        {!isOnToday && (
          <TouchableOpacity
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-gray-700"
            onPress={goToToday}
          >
            <Text
              className="text-sm text-purple-400"
              style={{ fontFamily: "MomoTrustSans-Medium" }}
            >
              Hoy
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <CalendarModeSwitch mode={mode} onChange={changeMode} />

      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity
          className="w-9 h-9 items-center justify-center"
          onPress={() => shift(-1)}
        >
          <FontAwesomeIcon icon={faChevronLeft} size={16} color="#9184d9" />
        </TouchableOpacity>
        {mode === "month" ? (
          <TouchableOpacity onPress={() => setMode("year")} activeOpacity={0.7}>
            <Text
              className="text-base text-purple-400"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              {rangeLabel}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            className="text-base text-purple-400"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            {rangeLabel}
          </Text>
        )}
        <TouchableOpacity
          className="w-9 h-9 items-center justify-center"
          onPress={() => shift(1)}
        >
          <FontAwesomeIcon icon={faChevronRight} size={16} color="#9184d9" />
        </TouchableOpacity>
      </View>

      {mode === "week" && (
        <WeekStrip
          days={weekDays}
          getCounts={getCounts}
          selectedStr={toDateStr(selectedDay)}
          todayStr={todayStr}
          onSelect={setSelectedDay}
        />
      )}

      {mode === "month" && (
        <MonthGrid
          cells={monthCells}
          getCounts={getCounts}
          selectedStr={toDateStr(selectedDay)}
          todayStr={todayStr}
          onSelect={(cell) => {
            setSelectedDay(cell.date);
            if (!cell.inMonth) {
              setAnchor(
                new Date(cell.date.getFullYear(), cell.date.getMonth(), 1),
              );
            }
          }}
          onSwipe={shift}
        />
      )}

      {mode === "year" ? (
        <YearGrid
          year={anchor.getFullYear()}
          tasks={tasks}
          today={today}
          onSelectMonth={selectMonthFromYear}
        />
      ) : (
        <DayTaskList
          date={selectedDay}
          tasks={tasks}
          todayStr={todayStr}
          isCompleted={isCompleted}
          setCompleted={setCompleted}
          onSelectTask={(taskId) =>
            setSelectedTask({ taskId, day: toDateStr(selectedDay) })
          }
        />
      )}

      <TaskDetailsModal
        task={detailTask}
        status={
          selectedTask
            ? getOccurrenceStatus(
                isCompleted(selectedTask.taskId, selectedTask.day),
                selectedTask.day,
                todayStr,
              )
            : "pending"
        }
        onClose={() => setSelectedTask(null)}
      />
    </SafeAreaView>
  );
}
