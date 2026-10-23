import { ConfirmModal } from "@/components/ConfirmModal";
import { ErrorBanner } from "@/components/ErrorBanner";
import { NOTE_COLORS, noteColorHex, noteTint } from "@/constants/note-colors";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useNotes } from "@/hooks/use-notes";
import { formatNoteDate } from "@/lib/note-format";
import { NoteColorKey } from "@/types/note";
import {
  faArrowLeft,
  faCheck,
  faPalette,
  faThumbtack,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const AUTOSAVE_MS = 500;

// Editor de una nota. `id` = "new" crea una; si no, edita la existente.
// Se guarda solo (con retraso al escribir y al salir); una nota vacía no se guarda
// y, si ya existía, se elimina al salir.
export default function NotaScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const isNew = !idParam || idParam === "new";

  const { notes, loading, error, clearError, newNoteId, saveNote, deleteNotes } =
    useNotes(user?.uid);

  // Id estable durante toda la vida de la pantalla.
  const noteIdRef = useRef<string | null>(isNew ? null : (idParam as string));
  if (noteIdRef.current === null && user) noteIdRef.current = newNoteId();

  const existing = !isNew ? notes.find((n) => n.id === idParam) : undefined;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState<NoteColorKey>("none");
  const [pinned, setPinned] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [ready, setReady] = useState(isNew);

  // Valores más recientes para guardar al salir sin depender de cierres viejos.
  const latest = useRef({ title, body, color, pinned });
  latest.current = { title, body, color, pinned };
  const lastSaved = useRef<string>("");
  const createdAt = useRef<number>(Date.now());
  const deleted = useRef(false);

  // Carga la nota existente una sola vez.
  useEffect(() => {
    if (ready || loading) return;
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
      setColor(existing.color ?? "none");
      setPinned(existing.pinned === true);
      createdAt.current = existing.createdAt ?? Date.now();
      lastSaved.current = JSON.stringify({
        title: existing.title,
        body: existing.body,
        color: existing.color ?? "none",
        pinned: existing.pinned === true,
      });
    }
    setReady(true);
  }, [ready, loading, existing]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const persist = () => {
    const id = noteIdRef.current;
    if (!id || deleted.current || !ready) return;
    const { title: t, body: b, color: c, pinned: p } = latest.current;
    const snapshot = JSON.stringify({ title: t, body: b, color: c, pinned: p });
    if (snapshot === lastSaved.current) return;

    const wasSaved = lastSaved.current !== "";
    const empty = t.trim() === "" && b.trim() === "";
    if (empty) {
      // Una nota que ya estaba guardada y se dejó vacía se descarta, como en
      // Samsung Notes. Si se vuelve a escribir, se guarda otra vez desde cero.
      if (wasSaved) {
        lastSaved.current = "";
        deleteNotes([id]);
      }
      return;
    }
    lastSaved.current = snapshot;
    saveNote(
      id,
      { title: t, body: b, color: c, pinned: p },
      wasSaved ? undefined : createdAt.current,
    );
  };

  // Guardado con retraso mientras se escribe.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(persist, AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, color, pinned, ready]);

  // Y al salir de la pantalla.
  useEffect(() => {
    return () => persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleDelete = async () => {
    setConfirmDelete(false);
    deleted.current = true;
    const id = noteIdRef.current;
    if (id && lastSaved.current !== "") await deleteNotes([id]);
    router.back();
  };

  const tint = noteTint(color);
  const accentHex = noteColorHex(color);
  const edited = existing?.updatedAt;

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-950"
      edges={["top", "left", "right"]}
    >
      {/* Barra superior */}
      <View
        className="flex-row items-center justify-between px-5 py-3 border-b border-gray-700"
        style={accentHex ? { backgroundColor: `${accentHex}22` } : undefined}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={colors.white} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-6">
          <TouchableOpacity onPress={() => setPinned((v) => !v)} hitSlop={10}>
            <FontAwesomeIcon
              icon={faThumbtack}
              size={18}
              color={pinned ? colors.accent : colors.gray500}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowColors((v) => !v)} hitSlop={10}>
            <FontAwesomeIcon
              icon={faPalette}
              size={18}
              color={showColors ? colors.accent : colors.gray400}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const empty = title.trim() === "" && body.trim() === "";
              if (empty && isNew) router.back();
              else setConfirmDelete(true);
            }}
            hitSlop={10}
          >
            <FontAwesomeIcon icon={faTrashCan} size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ErrorBanner message={error} onDismiss={clearError} />

      {/* Colores */}
      {showColors && (
        <View className="flex-row justify-between px-5 py-3 border-b border-gray-700">
          {NOTE_COLORS.map((c) => {
            const selected = color === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setColor(c.key)}
                className={`w-8 h-8 rounded-full justify-center items-center border-2 ${
                  c.hex ? "" : "bg-slate-800"
                } ${selected ? "border-white" : "border-gray-700"}`}
                style={c.hex ? { backgroundColor: c.hex } : undefined}
                accessibilityLabel={c.label}
              >
                {selected && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={11}
                    color={c.hex ? "#000000" : colors.white}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Contenido */}
      <ScrollView
        className="flex-1"
        style={tint ? { backgroundColor: tint.backgroundColor } : undefined}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: (keyboardHeight || insets.bottom) + 24,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          className="text-2xl text-white mb-2"
          placeholder="Título"
          placeholderTextColor={colors.gray500}
          value={title}
          onChangeText={setTitle}
          multiline
          style={{ fontFamily: "MomoTrustSans-SemiBold" }}
        />
        <TextInput
          className="text-base text-gray-100"
          placeholder="Escribe aquí tu nota..."
          placeholderTextColor={colors.gray500}
          value={body}
          onChangeText={setBody}
          multiline
          autoFocus={isNew}
          textAlignVertical="top"
          style={{ fontFamily: "MomoTrustSans-Regular", minHeight: 240, lineHeight: 24 }}
        />
      </ScrollView>

      {/* Pie */}
      <View
        className="px-5 py-2 border-t border-gray-700 flex-row justify-between"
        style={{ marginBottom: keyboardHeight }}
      >
        <Text
          className="text-xs text-gray-500"
          style={{ fontFamily: "MomoTrustSans-Regular" }}
        >
          {edited ? `Editada: ${formatNoteDate(edited)}` : "Nueva nota"}
        </Text>
        <Text
          className="text-xs text-gray-500"
          style={{ fontFamily: "MomoTrustSans-Regular" }}
        >
          {body.length} caracteres
        </Text>
      </View>

      <ConfirmModal
        visible={confirmDelete}
        icon={faTrashCan}
        title="¿Eliminar esta nota?"
        message="No se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}
