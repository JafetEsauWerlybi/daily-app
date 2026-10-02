import { AddTaskData, AddTaskModal } from "@/components/AddTaskModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { TaskRow } from "@/components/TaskRow";
import { useAuth } from "@/contexts/auth-context";
import { useBackHandler } from "@/hooks/use-back-handler";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskLogs } from "@/hooks/use-task-logs";
import {
  getOccurrenceStatus,
  isTaskForDate,
  toDateStr,
} from "@/lib/task-schedule";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HoyScreen() {
  const { user } = useAuth();
  const today = new Date();
  const todayStr = toDateStr(today);
  const { tasks, loading, addTask } = useTasks(user?.uid);
  const { isCompleted, setCompleted } = useTaskLogs(
    user?.uid,
    todayStr,
    todayStr,
  );
  const [newTaskText, setNewTaskText] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Manejar botón de regresar: navega por historial de tabs o pide confirmar salida
  const { exitModalVisible, confirmExit, cancelExit } = useBackHandler("hoy");

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleQuickAdd = async () => {
    if (!newTaskText.trim() || !user) return;

    await addTask({
      userId: user.uid,
      title: newTaskText,
      category: "Personal",
      dateStart: todayStr,
    });
    setNewTaskText("");
  };

  const handlePlusPress = () => {
    setAddModalVisible(true);
  };

  const handleAddTaskSubmit = async (data: AddTaskData) => {
    if (!user) return;

    await addTask({
      userId: user.uid,
      title: data.title,
      category: data.category,
      time: data.time,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      repeatDays: data.repeatDays,
    });
    setNewTaskText("");
  };

  const dayName = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ][today.getDay()];
  const months = [
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
  const dateStr = `${dayName}, ${today.getDate()} ${months[today.getMonth()]}`;

  const todayTasks = tasks
    .filter((t) => isTaskForDate(t, today))
    .sort(
      (a, b) =>
        Number(isCompleted(a.id, todayStr)) -
        Number(isCompleted(b.id, todayStr)),
    );
  const completedCount = todayTasks.filter((t) =>
    isCompleted(t.id, todayStr),
  ).length;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (loading) {
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
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-700">
        <Text
          className="text-3xl text-white mb-1"
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        >
          Hoy
        </Text>
        <Text
          className="text-sm text-gray-400 mb-3"
          style={{ fontFamily: "MomoTrustSans-Regular" }}
        >
          {dateStr}
        </Text>
        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
          <View
            className="h-full bg-purple-500 rounded-full"
            style={{
              width: `${todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0}%`,
            }}
          />
        </View>
        <Text
          className="text-xs text-gray-400"
          style={{ fontFamily: "MomoTrustSans-Regular" }}
        >
          {completedCount}/{todayTasks.length}
        </Text>
      </View>

      <View className="flex-1">
        {/* Tasks List */}
        {todayTasks.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text
              className="text-gray-400 text-base"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              No hay tareas para hoy
            </Text>
          </View>
        ) : (
          <FlatList
            data={todayTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const completed = isCompleted(item.id, todayStr);
              return (
                <TaskRow
                  task={item}
                  status={getOccurrenceStatus(completed, todayStr, todayStr)}
                  canToggle
                  onToggle={() => setCompleted(item.id, todayStr, !completed)}
                  onPress={() => setSelectedTaskId(item.id)}
                />
              );
            }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          />
        )}

        {/* Add Task Input */}
        <View
          className="flex-row px-5 py-3 border-t border-gray-700 gap-2"
          style={{ marginBottom: keyboardHeight }}
        >
          <TextInput
            className="flex-1 bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700"
            placeholder="Agrega una nueva tarea..."
            placeholderTextColor="#666"
            value={newTaskText}
            onChangeText={setNewTaskText}
            onSubmitEditing={handleQuickAdd}
            style={{ fontFamily: "MomoTrustSans-Regular" }}
          />
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-purple-500 justify-center items-center"
            onPress={handlePlusPress}
          >
            <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmModal
        visible={exitModalVisible}
        title="¿Seguro que quieres salir?"
        message="Se cerrará la aplicación Daily!"
        confirmText="Sí, salir"
        cancelText="Cancelar"
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />

      <AddTaskModal
        visible={addModalVisible}
        initialTitle={newTaskText}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddTaskSubmit}
      />

      <TaskDetailsModal
        task={selectedTask}
        status={getOccurrenceStatus(
          selectedTask ? isCompleted(selectedTask.id, todayStr) : false,
          todayStr,
          todayStr,
        )}
        onClose={() => setSelectedTaskId(null)}
      />
    </SafeAreaView>
  );
}
