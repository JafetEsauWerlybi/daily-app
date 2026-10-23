import { ConfirmModal } from "@/components/ConfirmModal";
import { ErrorBanner } from "@/components/ErrorBanner";
import { NoteCard } from "@/components/NoteCard";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useBackHandler } from "@/hooks/use-back-handler";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/types/note";
import {
  faListUl,
  faMagnifyingGlass,
  faNoteSticky,
  faPlus,
  faTableCellsLarge,
  faThumbtack,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewMode = "grid" | "list";
const VIEW_KEY = "daily.notes.view.v1";

// Reparte las notas en dos columnas procurando que midan parecido (estilo masonry).
function splitColumns(notes: Note[]): [Note[], Note[]] {
  const left: Note[] = [];
  const right: Note[] = [];
  let leftWeight = 0;
  let rightWeight = 0;
  for (const note of notes) {
    const weight = 3 + Math.min(7, Math.ceil(note.body.length / 35));
    if (leftWeight <= rightWeight) {
      left.push(note);
      leftWeight += weight;
    } else {
      right.push(note);
      rightWeight += weight;
    }
  }
  return [left, right];
}

export default function NotasScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  useBackHandler("notas");
  const { notes, loading, error, clearError, setPinned, deleteNotes } = useNotes(
    user?.uid,
  );

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selecting = selectedIds.length > 0;

  useEffect(() => {
    AsyncStorage.getItem(VIEW_KEY)
      .then((raw) => {
        if (raw === "grid" || raw === "list") setViewMode(raw);
      })
      .catch(() => {});
  }, []);

  const toggleViewMode = () => {
    const next: ViewMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(next);
    AsyncStorage.setItem(VIEW_KEY, next).catch(() => {});
  };

  // Con notas seleccionadas, el botón atrás solo cancela la selección.
  useEffect(() => {
    if (!selecting) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedIds([]);
      return true;
    });
    return () => sub.remove();
  }, [selecting]);

  const { pinned, others } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(term) ||
            n.body.toLowerCase().includes(term),
        )
      : notes;
    return {
      pinned: filtered.filter((n) => n.pinned),
      others: filtered.filter((n) => !n.pinned),
    };
  }, [notes, search]);

  const selectedNotes = notes.filter((n) => selectedIds.includes(n.id));
  // Si todas las seleccionadas están fijadas, el botón las desfija.
  const allSelectedPinned =
    selectedNotes.length > 0 && selectedNotes.every((n) => n.pinned);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const openNote = (id: string) => router.navigate({ pathname: "/nota", params: { id } });

  const renderCard = (note: Note) => (
    <View key={note.id} className="mb-3">
      <NoteCard
        note={note}
        compact={viewMode === "list"}
        selected={selectedIds.includes(note.id)}
        selecting={selecting}
        onPress={() => (selecting ? toggleSelect(note.id) : openNote(note.id))}
        onLongPress={() => toggleSelect(note.id)}
      />
    </View>
  );

  const renderGroup = (title: string | null, group: Note[]) => {
    if (group.length === 0) return null;
    const [left, right] = splitColumns(group);
    return (
      <View className="mb-2">
        {title && (
          <Text
            className="text-xs text-gray-400 mb-2 ml-1"
            style={{ fontFamily: "MomoTrustSans-Medium" }}
          >
            {title}
          </Text>
        )}
        {viewMode === "list" ? (
          group.map(renderCard)
        ) : (
          <View className="flex-row gap-3">
            <View className="flex-1">{left.map(renderCard)}</View>
            <View className="flex-1">{right.map(renderCard)}</View>
          </View>
        )}
      </View>
    );
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await deleteNotes(selectedIds);
    setSelectedIds([]);
  };

  const handlePin = async () => {
    await setPinned(selectedIds, !allSelectedPinned);
    setSelectedIds([]);
  };

  const noResults = !loading && notes.length > 0 && pinned.length + others.length === 0;

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      {selecting ? (
        <View className="px-5 py-4 border-b border-gray-700 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setSelectedIds([])}
              hitSlop={10}
              className="mr-4"
            >
              <FontAwesomeIcon icon={faXmark} size={20} color={colors.white} />
            </TouchableOpacity>
            <Text
              className="text-xl text-white"
              style={{ fontFamily: "MomoTrustSans-SemiBold" }}
            >
              {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "seleccionada" : "seleccionadas"}
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <TouchableOpacity onPress={handlePin} hitSlop={10}>
              <FontAwesomeIcon
                icon={faThumbtack}
                size={18}
                color={allSelectedPinned ? colors.gray400 : colors.accent}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmDelete(true)} hitSlop={10}>
              <FontAwesomeIcon icon={faTrashCan} size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="px-5 py-4 border-b border-gray-700 flex-row items-center justify-between">
          <Text
            className="text-3xl text-white"
            style={{ fontFamily: "MomoTrustSans-SemiBold" }}
          >
            Notas
          </Text>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-slate-800 border border-gray-700 justify-center items-center"
            onPress={toggleViewMode}
          >
            <FontAwesomeIcon
              icon={viewMode === "grid" ? faListUl : faTableCellsLarge}
              size={16}
              color={colors.accent}
            />
          </TouchableOpacity>
        </View>
      )}

      <ErrorBanner message={error} onDismiss={clearError} />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Buscar */}
          {notes.length > 0 && (
            <View className="flex-row items-center bg-slate-800 border border-gray-700 rounded-lg px-3 mb-4">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                size={14}
                color={colors.gray500}
              />
              <TextInput
                className="flex-1 py-2.5 px-2 text-gray-100 text-sm"
                placeholder="Buscar en tus notas"
                placeholderTextColor={colors.gray500}
                value={search}
                onChangeText={setSearch}
                style={{ fontFamily: "MomoTrustSans-Regular" }}
              />
              {search !== "" && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                  <FontAwesomeIcon
                    icon={faXmark}
                    size={14}
                    color={colors.gray500}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {notes.length === 0 && (
            <View className="items-center pt-24">
              <FontAwesomeIcon
                icon={faNoteSticky}
                size={44}
                color={colors.gray600}
              />
              <Text
                className="text-base text-gray-300 mt-4 mb-1"
                style={{ fontFamily: "MomoTrustSans-Medium" }}
              >
                Aún no tienes notas
              </Text>
              <Text
                className="text-sm text-gray-500 text-center"
                style={{ fontFamily: "MomoTrustSans-Regular" }}
              >
                Toca el botón + para escribir tu primera nota.
              </Text>
            </View>
          )}

          {noResults && (
            <Text
              className="text-sm text-gray-400 text-center mt-16"
              style={{ fontFamily: "MomoTrustSans-Regular" }}
            >
              No hay notas que coincidan con «{search.trim()}».
            </Text>
          )}

          {renderGroup(pinned.length > 0 && others.length > 0 ? "Fijadas" : null, pinned)}
          {renderGroup(pinned.length > 0 && others.length > 0 ? "Otras" : null, others)}
        </ScrollView>
      )}

      {/* Nueva nota */}
      {!selecting && (
        <TouchableOpacity
          className="absolute right-5 bottom-5 w-14 h-14 rounded-full bg-purple-500 justify-center items-center"
          style={{ elevation: 6 }}
          onPress={() => router.navigate({ pathname: "/nota", params: { id: "new" } })}
        >
          <FontAwesomeIcon icon={faPlus} size={20} color={colors.onAccent} />
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={confirmDelete}
        icon={faTrashCan}
        title={
          selectedIds.length === 1 ? "¿Eliminar esta nota?" : "¿Eliminar estas notas?"
        }
        message="No se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}
