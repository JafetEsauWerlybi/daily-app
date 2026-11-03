import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "@react-native-firebase/firestore";
import { db } from "@/lib/firebase";
import { describeFirestoreError } from "@/lib/firestore-error";
import { logId } from "@/lib/task-schedule";
import { TaskLog } from "@/types/task";

// Logs de cumplimiento en users/{userId}/taskLogs, limitados al rango [from, to]
// (YYYY-MM-DD). Al ser un rango sobre un solo campo no requiere índice compuesto.
export function useTaskLogs(
  userId: string | undefined,
  from: string,
  to: string,
) {
  const [logs, setLogs] = useState<Record<string, TaskLog>>({});
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

    const q = query(
      collection(db, "users", userId, "taskLogs"),
      where("date", ">=", from),
      where("date", "<=", to),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const next: Record<string, TaskLog> = {};
        snapshot.forEach((d) => {
          next[d.id] = { id: d.id, ...d.data() } as TaskLog;
        });
        setLogs(next);
        setLoading(false);
        setSyncing(false);
      },
      (err) => {
        setError(describeFirestoreError(err, "Error loading task logs"));
        setLoading(false);
        setSyncing(false);
      },
    );
  }, [userId, from, to, refreshKey]);

  const clearError = () => setError(null);

  const refresh = () => {
    setError(null);
    setSyncing(true);
    setRefreshKey((k) => k + 1);
  };

  const isCompleted = (taskId: string, day: string) =>
    logs[logId(taskId, day)]?.completed === true;

  // Sin await: offline la promesa queda pendiente hasta reconectar (ver use-notes).
  const setCompleted = (taskId: string, day: string, completed: boolean) => {
    if (!userId) return;
    setDoc(doc(db, "users", userId, "taskLogs", logId(taskId, day)), {
      taskId,
      date: day,
      completed,
      completedAt: completed ? Date.now() : null,
      updatedAt: serverTimestamp(),
    }).catch((err) =>
      setError(describeFirestoreError(err, "Error updating task log")),
    );
  };

  return {
    logs,
    loading,
    syncing,
    error,
    clearError,
    refresh,
    isCompleted,
    setCompleted,
  };
}
