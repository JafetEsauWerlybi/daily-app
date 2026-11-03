import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "@react-native-firebase/firestore";
import { db } from "@/lib/firebase";
import { describeFirestoreError } from "@/lib/firestore-error";
import { Note } from "@/types/note";

type NoteFields = Pick<Note, "title" | "body" | "color" | "pinned">;

// Notas del usuario en users/{userId}/notes, de la más reciente a la más antigua.
export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", userId, "notes"),
      orderBy("updatedAt", "desc"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        setNotes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Note));
        setLoading(false);
      },
      (err) => {
        setError(describeFirestoreError(err, "Error loading notes"));
        setLoading(false);
      },
    );
  }, [userId]);

  const clearError = () => setError(null);

  // Id nuevo sin escribir nada: la nota solo se guarda cuando tiene contenido.
  const newNoteId = () =>
    doc(collection(db, "users", userId as string, "notes")).id;

  // Crea o actualiza (merge). `createdAt` solo se manda al crear.
  // No se espera la promesa: sin internet solo se resuelve al volver la conexión,
  // pero el cambio ya está en la caché local y la lista se actualiza al instante.
  const saveNote = (id: string, fields: NoteFields, createdAt?: number) => {
    if (!userId) return;
    setDoc(
      doc(db, "users", userId, "notes", id),
      {
        ...fields,
        ...(createdAt !== undefined ? { createdAt } : {}),
        updatedAt: Date.now(),
      },
      { merge: true },
    ).catch((err) => setError(describeFirestoreError(err, "Error saving note")));
  };

  const setPinned = (ids: string[], pinned: boolean) => {
    if (!userId || ids.length === 0) return;
    const batch = writeBatch(db);
    // Fijar no cambia la fecha de edición: la nota conserva su lugar entre las demás.
    ids.forEach((id) =>
      batch.update(doc(db, "users", userId, "notes", id), { pinned }),
    );
    batch
      .commit()
      .catch((err) => setError(describeFirestoreError(err, "Error updating notes")));
  };

  const deleteNotes = (ids: string[]) => {
    if (!userId || ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(doc(db, "users", userId, "notes", id)));
    batch
      .commit()
      .catch((err) => setError(describeFirestoreError(err, "Error deleting notes")));
  };

  return {
    notes,
    loading,
    error,
    clearError,
    newNoteId,
    saveNote,
    setPinned,
    deleteNotes,
  };
}
