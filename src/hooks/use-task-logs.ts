import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
        setError(err.message);
        setLoading(false);
        setSyncing(false);
      },
    );
  }, [userId, from, to, refreshKey]);

  const refresh = () => {
    setSyncing(true);
    setRefreshKey((k) => k + 1);
  };

  const isCompleted = (taskId: string, day: string) =>
    logs[logId(taskId, day)]?.completed === true;

  const setCompleted = async (
    taskId: string,
    day: string,
    completed: boolean,
  ) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, "users", userId, "taskLogs", logId(taskId, day)), {
        taskId,
        date: day,
        completed,
        completedAt: completed ? Date.now() : null,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating task log");
    }
  };

  return { logs, loading, syncing, error, refresh, isCompleted, setCompleted };
}
