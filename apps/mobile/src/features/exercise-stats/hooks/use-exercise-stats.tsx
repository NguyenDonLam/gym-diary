// src/features/exercise-stat/hooks/use-exercise-stat.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ExerciseStat } from "../domain/types";
import { exerciseStatRepository } from "../data/repository";

type Status = "idle" | "loading" | "success" | "error";

export function useExerciseStat(exerciseId: string | null | undefined) {
  const [data, setData] = useState<ExerciseStat | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<unknown>(null);

  const lastIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const id = exerciseId ?? null;

    // If no id, this hook is effectively disabled.
    if (!id) {
      setData(null);
      setStatus("success");
      setError(null);
      lastIdRef.current = null;
      return;
    }

    setStatus("loading");
    setError(null);
    lastIdRef.current = id;

    try {
      const stat = await exerciseStatRepository.get(id);

      // Protect against race: exerciseId changed while awaiting.
      if (lastIdRef.current !== id) return;

      setData(stat);
      setStatus("success");
    } catch (e) {
      if (lastIdRef.current !== id) return;
      setError(e);
      setStatus("error");
    }
  }, [exerciseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      data,
      status,
      error,
      refresh,
      isLoading: status === "loading",
      isError: status === "error",
    }),
    [data, status, error, refresh]
  );
}

export function useExerciseStats() {
  const [data, setData] = useState<ExerciseStat[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<unknown>(null);

  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const rows = await exerciseStatRepository.getAll();
      if (!aliveRef.current) return;

      setData(rows);
      setStatus("success");
    } catch (e) {
      if (!aliveRef.current) return;
      setError(e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  const byExerciseId = useMemo(() => {
    const out: Record<string, ExerciseStat> = {};
    for (const s of data) out[s.exerciseId] = s;
    return out;
  }, [data]);

  return useMemo(
    () => ({
      data,
      byExerciseId,
      status,
      error,
      refresh,
      isLoading: status === "loading",
      isError: status === "error",
    }),
    [data, byExerciseId, status, error, refresh]
  );
}
