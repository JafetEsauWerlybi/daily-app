import { CATEGORY_COLORS } from "@/constants/categories";
import { OccurrenceStatus, Task } from "@/types/task";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Text, TouchableOpacity, View } from "react-native";

interface TaskRowProps {
  task: Task;
  status: OccurrenceStatus;
  // Los días pasados no se pueden marcar ni desmarcar.
  canToggle: boolean;
  onToggle: () => void;
  onPress: () => void;
}

export function TaskRow({
  task,
  status,
  canToggle,
  onToggle,
  onPress,
}: TaskRowProps) {
  const completed = status === "completed";
  const missed = status === "missed";

  return (
    <View
      className="flex-row items-center border-b border-gray-800"
      style={{ opacity: completed || missed ? 0.6 : 1 }}
    >
      <TouchableOpacity
        className="py-3 pr-3"
        onPress={onToggle}
        disabled={!canToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 0 }}
      >
        <View
          className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
            completed
              ? "bg-purple-500 border-purple-400"
              : missed
                ? "border-red-500"
                : "border-purple-400"
          }`}
        >
          {completed && (
            <FontAwesomeIcon icon={faCheck} size={12} color="#fff" />
          )}
          {missed && (
            <FontAwesomeIcon icon={faXmark} size={12} color="#ef4444" />
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-1 py-3"
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          className={`text-sm mb-1 ${
            completed ? "line-through text-gray-500" : "text-gray-100"
          }`}
          style={{ fontFamily: "MomoTrustSans-Medium" }}
        >
          {task.title}
        </Text>
        <View className="flex-row items-center gap-2">
          {task.category && (
            <View
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: CATEGORY_COLORS[task.category] || "#9184d9",
              }}
            >
              <Text
                className="text-[11px] text-white"
                style={{ fontFamily: "MomoTrustSans-Medium" }}
              >
                {task.category}
              </Text>
            </View>
          )}
          {task.time && (
            <Text
              className="text-[11px] text-gray-400"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              {task.time}
            </Text>
          )}
          {missed && (
            <Text
              className="text-[11px] text-red-400"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              No completada
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
