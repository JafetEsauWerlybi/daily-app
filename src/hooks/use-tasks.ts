import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocsFromCache,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { db } from "@/lib/firebase";
import { describeFirestoreError } from "@/lib/firestore-error";
import { Task } from "@/types/task";

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  // true cuando los datos vienen de la caché local sin confirmar con el servidor.
  const [fromCache, setFromCache] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setSyncing(false);
      return;
    }

    try {
      const q = query(collection(db, "tasks"), where("userId", "==", userId));

      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          const tasksData: Task[] = [];
          snapshot.forEach((doc) => {
            tasksData.push({ id: doc.id, ...doc.data() } as Task);
          });
          setTasks(tasksData);
          setFromCache(snapshot.metadata.fromCache);
          setLoading(false);
          setSyncing(false);
        },
        (err) => {
          setError(describeFirestoreError(err, "Error loading tasks"));
          setLoading(false);
          setSyncing(false);
        },
      );

      return unsubscribe;
    } catch (err) {
      setError(describeFirestoreError(err, "Error loading tasks"));
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, refreshKey]);

  const clearError = () => setError(null);

  // Vuelve a suscribirse a Firestore para traer el estado más reciente.
  const refresh = () => {
    setError(null);
    setSyncing(true);
    setRefreshKey((k) => k + 1);
  };

  // Borra la tarea junto con los logs de cumplimiento (users/{uid}/taskLogs) que haya
  // en la caché local. Se lee de la caché (no del servidor) para que funcione sin
  // internet: un log que no esté en caché queda huérfano, y es inofensivo porque los
  // logs solo se consultan por tarea + día de una tarea existente.
  const deleteTask = (taskId: string) => {
    const logsQuery = userId
      ? query(
          collection(db, "users", userId, "taskLogs"),
          where("taskId", "==", taskId),
        )
      : null;
    (logsQuery
      ? getDocsFromCache(logsQuery).catch(() => null)
      : Promise.resolve(null)
    )
      .then((logs) => {
        const batch = writeBatch(db);
        logs?.forEach((d) => batch.delete(d.ref));
        batch.delete(doc(db, "tasks", taskId));
        return batch.commit();
      })
      .catch((err) =>
        setError(describeFirestoreError(err, "Error deleting task")),
      );
  };

  // Corta la vigencia de la tarea: deja de ocurrir después de `dateEnd`.
  const updateTaskEnd = (taskId: string, dateEnd: string) => {
    updateDoc(doc(db, "tasks", taskId), {
      dateEnd,
      updatedAt: serverTimestamp(),
    }).catch((err) =>
      setError(describeFirestoreError(err, "Error updating task")),
    );
  };

  const addTask = (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    // Firestore rechaza valores `undefined` (campos opcionales sin llenar).
    const cleanData = Object.fromEntries(
      Object.entries(taskData).filter(([, v]) => v !== undefined),
    );
    addDoc(collection(db, "tasks"), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => setError(describeFirestoreError(err, "Error adding task")));
  };

  return {
    tasks,
    loading,
    syncing,
    fromCache,
    error,
    clearError,
    refresh,
    deleteTask,
    updateTaskEnd,
    addTask,
  };
}
