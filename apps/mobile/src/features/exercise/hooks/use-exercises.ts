import { Exercise } from "@packages/exercise/type";
import { useEffect, useState } from "react";

export function useExercises() {
  const [options, setOptions] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // TODO: use real repository
        // const rows = await exerciseDao.findAllOrderedByName();
        // const mapped: ExerciseOption[] = rows.map(...);
        const mapped: Exercise[] = []; // placeholder
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
