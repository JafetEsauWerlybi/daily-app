import { useTheme } from "@/contexts/theme-context";
import {
  CalendarMode,
  CalendarModeSwitch,
} from "@/components/calendar/CalendarModeSwitch";
import { DayTaskList } from "@/components/calendar/DayTaskList";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekStrip } from "@/components/calendar/WeekStrip";
import { YearGrid } from "@/components/calendar/YearGrid";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TaskAction, TaskDetailsModal } from "@/components/TaskDetailsModal";
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
  faCheck,
  faChevronLeft,
  faChevronRight,
  faFlagCheckered,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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

interface PendingConfirm {
  title: string;
  message: string;
  confirmText: string;
  icon: IconDefinition;
  run: () => void;
}

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
  const { colors } = useTheme();
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
  // Confirmación pendiente de una acción del modal de detalle.
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

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

  const {
    tasks,
    loading: tasksLoading,
    deleteTask,
    updateTaskEnd,
  } = useTasks(user?.uid);
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

  // Acciones del modal de detalle (solo hoy y días futuros; el pasado es de solo
  // lectura). Finalizar/Cerrar/Eliminar piden confirmación porque cambian la
  // vigencia de la tarea y, con ella, el calendario de todos sus días.
  const buildActions = (): TaskAction[] | undefined => {
    if (!selectedTask || !detailTask) return undefined;
    const { taskId, day } = selectedTask;
    if (day < todayStr) return undefined;

    const isToday = day === todayStr;
    const recurring = (detailTask.repeatDays?.length ?? 0) > 0;
    const done = isCompleted(taskId, day);
    const close = () => setSelectedTask(null);

    const toggle: TaskAction = {
      key: "toggle",
      label: done ? "Quitar como completada" : "Marcar como completada",
      onPress: () => {
        if (isToday) {
          setCompleted(taskId, day, !done);
          close();
          return;
        }
        setConfirm({
          title: done ? "¿Quitar como completada?" : "¿Marcar como completada?",
          message: `Se actualizará esta tarea para el ${day}.`,
          confirmText: "Sí, continuar",
          icon: faCheck,
          run: () => {
            setCompleted(taskId, day, !done);
            close();
          },
        });
      },
    };

    const actions: TaskAction[] = [];

    if (isToday) {
      if (recurring && detailTask.dateEnd !== todayStr) {
        actions.push({
          key: "finish-today",
          label: "Finalizar hoy",
          onPress: () =>
            setConfirm({
              title: "¿Finalizar hoy?",
              message:
                "La tarea dejará de repetirse después de hoy. Hoy sigue contando.",
              confirmText: "Sí, finalizar",
              icon: faFlagCheckered,
              run: () => {
                updateTaskEnd(taskId, todayStr);
                close();
              },
            }),
        });
      }
      actions.push(toggle);
      return actions;
    }

    if (recurring && detailTask.dateEnd !== day) {
      actions.push({
        key: "close-day",
        label: "Cerrar este día",
        onPress: () =>
          setConfirm({
            title: "¿Cerrar este día?",
            message: `La tarea terminará el ${day}. Ese día sigue contando, pero no se marca como completada.`,
            confirmText: "Sí, cerrar",
            icon: faFlagCheckered,
            run: () => {
              updateTaskEnd(taskId, day);
              close();
            },
          }),
      });
    }

    actions.push({
      key: "delete",
      label: "Eliminar tarea",
      tone: "danger",
      onPress: () => {
        // Si aún no empieza (o no tiene inicio) se borra completa; si ya empezó,
        // solo se corta la vigencia al día anterior para conservar el historial.
        const startsLater =
          !detailTask.dateStart || detailTask.dateStart > todayStr;
        setConfirm({
          title: "¿Eliminar tarea?",
          message: startsLater
            ? "Se borrará la tarea completa. No se puede deshacer."
            : `La tarea dejará de aparecer desde el ${day}. El historial anterior se conserva.`,
          confirmText: "Sí, eliminar",
          icon: faTrash,
          run: () => {
            if (startsLater) {
              deleteTask(taskId);
            } else {
              const before = addDays(new Date(`${day}T00:00:00`), -1);
              updateTaskEnd(taskId, toDateStr(before));
            }
            close();
          },
        });
      },
    });

    actions.push(toggle);
    return actions;
  };

  if (tasksLoading || logsLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-950"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
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
          <FontAwesomeIcon icon={faChevronLeft} size={16} color={colors.accent} />
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
          <FontAwesomeIcon icon={faChevronRight} size={16} color={colors.accent} />
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
        // Cuadrícula + lista del día scrollean juntas: un mes de 6 filas ocupa casi
        // toda la pantalla y la lista quedaba sin espacio visible.
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
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
          <DayTaskList
            scrollable={false}
            date={selectedDay}
            tasks={tasks}
            todayStr={todayStr}
            isCompleted={isCompleted}
            setCompleted={setCompleted}
            onSelectTask={(taskId) =>
              setSelectedTask({ taskId, day: toDateStr(selectedDay) })
            }
          />
        </ScrollView>
      )}

      {mode === "year" && (
        <YearGrid
          year={anchor.getFullYear()}
          tasks={tasks}
          today={today}
          onSelectMonth={selectMonthFromYear}
        />
      )}

      {mode === "week" && (
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
        actions={buildActions()}
        onClose={() => setSelectedTask(null)}
      />

      <ConfirmModal
        visible={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmText={confirm?.confirmText}
        icon={confirm?.icon}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </SafeAreaView>
  );
}
