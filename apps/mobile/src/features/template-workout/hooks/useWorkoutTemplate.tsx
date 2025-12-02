// src/features/workoutTemplate/hooks/use-workout-templates.ts
import { useEffect, useState, useCallback } from "react";
import { TemplateWorkout } from "../domain/type";
import { workoutTemplateRepository } from "../data/template-workout-repository";

type UseWorkoutTemplatesResult = {
  templates: TemplateWorkout[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useWorkoutTemplates(): UseWorkoutTemplatesResult {
  const [templates, setTemplates] = useState<TemplateWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await workoutTemplateRepository.getAll();
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load templates"));
      setTemplates([]);
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
        // already handled above
      }
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  return { templates, isLoading, error, refetch: load };
}
