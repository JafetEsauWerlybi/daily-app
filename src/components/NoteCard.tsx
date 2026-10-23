import { noteTint } from "@/constants/note-colors";
import { useTheme } from "@/contexts/theme-context";
import { formatNoteDate } from "@/lib/note-format";
import { Note } from "@/types/note";
import { faCheck, faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Text, TouchableOpacity, View } from "react-native";

interface NoteCardProps {
  note: Note;
  // En lista la vista previa es más corta que en cuadrícula.
  compact: boolean;
  selected: boolean;
  selecting: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function NoteCard({
  note,
  compact,
  selected,
  selecting,
  onPress,
  onLongPress,
}: NoteCardProps) {
  const { colors } = useTheme();
  const tint = noteTint(note.color);
  const hasTitle = note.title.trim() !== "";
  const hasBody = note.body.trim() !== "";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      className={`rounded-xl px-3.5 py-3 border-2 ${tint ? "" : "bg-slate-800"} ${
        selected ? "" : tint ? "" : "border-gray-700"
      }`}
      style={[
        tint ?? undefined,
        selected ? { borderColor: colors.accent } : undefined,
      ]}
    >
      <View className="flex-row items-start">
        <Text
          className="flex-1 text-base text-white"
          numberOfLines={2}
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        >
          {hasTitle ? note.title : hasBody ? "" : "Nota vacía"}
        </Text>
        {note.pinned && !selecting && (
          <FontAwesomeIcon
            icon={faThumbtack}
            size={12}
            color={colors.accent}
            style={{ marginLeft: 8, marginTop: 4 }}
          />
        )}
        {selecting && (
          <View
            className={`w-5 h-5 rounded-full border-2 justify-center items-center ml-2 ${
              selected ? "bg-purple-500 border-purple-500" : "border-gray-500"
            }`}
          >
            {selected && (
              <FontAwesomeIcon icon={faCheck} size={10} color={colors.onAccent} />
            )}
          </View>
        )}
      </View>

      {hasBody && (
        <Text
          className="text-sm text-gray-300 mt-1"
          numberOfLines={compact ? 2 : 7}
          style={{ fontFamily: "MomoTrustSans-Regular" }}
        >
          {note.body}
        </Text>
      )}

      <Text
        className="text-xs text-gray-500 mt-2"
        style={{ fontFamily: "MomoTrustSans-Regular" }}
      >
        {formatNoteDate(note.updatedAt)}
      </Text>
    </TouchableOpacity>
  );
}
