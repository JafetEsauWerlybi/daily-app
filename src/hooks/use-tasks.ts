import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { describeFirestoreError } from "@/lib/firestore-error";
import { Task } from "@/types/task";

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
        (snapshot) => {
          const tasksData: Task[] = [];
          snapshot.forEach((doc) => {
            tasksData.push({ id: doc.id, ...doc.data() } as Task);
          });
          setTasks(tasksData);
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

  // Borra la tarea junto con sus logs de cumplimiento (users/{uid}/taskLogs).
  const deleteTask = async (taskId: string) => {
    try {
      const batch = writeBatch(db);
      if (userId) {
        const logs = await getDocs(
          query(
            collection(db, "users", userId, "taskLogs"),
            where("taskId", "==", taskId),
          ),
        );
        logs.forEach((d) => batch.delete(d.ref));
      }
      batch.delete(doc(db, "tasks", taskId));
      await batch.commit();
    } catch (err) {
      setError(describeFirestoreError(err, "Error deleting task"));
    }
  };

  // Corta la vigencia de la tarea: deja de ocurrir después de `dateEnd`.
  const updateTaskEnd = async (taskId: string, dateEnd: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        dateEnd,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(describeFirestoreError(err, "Error updating task"));
    }
  };

  const addTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      // Firestore rechaza valores `undefined` (campos opcionales sin llenar).
      const cleanData = Object.fromEntries(
        Object.entries(taskData).filter(([, v]) => v !== undefined),
      );
      await addDoc(collection(db, "tasks"), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(describeFirestoreError(err, "Error adding task"));
    }
  };

  return {
    tasks,
    loading,
    syncing,
    error,
    clearError,
    refresh,
    deleteTask,
    updateTaskEnd,
    addTask,
  };
}
