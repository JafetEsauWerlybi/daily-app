import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
          setError(err.message);
          setLoading(false);
          setSyncing(false);
        },
      );

      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading tasks");
      setLoading(false);
      setSyncing(false);
    }
  }, [userId, refreshKey]);

  // Vuelve a suscribirse a Firestore para traer el estado más reciente.
  const refresh = () => {
    setSyncing(true);
    setRefreshKey((k) => k + 1);
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting task");
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
      setError(err instanceof Error ? err.message : "Error adding task");
    }
  };

  return { tasks, loading, syncing, error, refresh, deleteTask, addTask };
}
