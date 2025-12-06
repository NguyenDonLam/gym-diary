import { useEffect, useState, useCallback } from "react";
import { Exercise } from "@packages/exercise/type";
import { exerciseRepository } from "../data/exercise-repository";

export function useExercises() {
  const [options, setOptions] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const exercises: Exercise[] = await exerciseRepository.getAll();
      const mapped: Exercise[] = exercises.map((exercise) => exercise);
      setOptions(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const exercises: Exercise[] = await exerciseRepository.getAll();
        const mapped: Exercise[] = exercises.map((exercise) => exercise);

        if (!cancelled) {
          setOptions(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, refetch };
}
