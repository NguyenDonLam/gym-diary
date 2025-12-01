import { Exercise } from "@packages/exercise/type";
import { useEffect, useState } from "react";
import { exerciseRepository } from "../data/exercise-repository";

export function useExercises() {
  const [options, setOptions] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const exercises: Exercise[] = await exerciseRepository.getAll();

        // implement this mapping with your real fields
        const mapped: Exercise[] = exercises.map((exercise) => (exercise));

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

  return { options, loading };
}
