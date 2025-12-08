// src/features/workoutTemplate/hooks/use-workout-templates.ts
import { useEffect, useState, useCallback } from "react";
import { WorkoutProgram } from "../domain/type";
import { workoutProgramRepository } from "../data/workout-program-repository";

type UseWorkoutTemplatesResult = {
  programs: WorkoutProgram[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
};

export function useWorkoutPrograms(): UseWorkoutTemplatesResult {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await workoutProgramRepository.getAll();
      setPrograms(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load templates"));
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await load();
      } catch {
        // handled above
      }
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const deleteProgram = useCallback(async (id: string) => {
    // 1) delete in storage
    await workoutProgramRepository.delete(id);
    // 2) sync local state
    setPrograms((prev) => prev.filter((tpl) => tpl.id !== id));
  }, []);

  return { programs, isLoading, error, refetch: load, deleteProgram };
}
