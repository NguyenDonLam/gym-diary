import { useEffect, useRef, useState, useCallback } from "react";
import { Exercise } from "@gym-diary/exercise/type";
import { exerciseRepository } from "../data/exercise-repository";

export function useExercises() {
  const [options, setOptions] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    try {
      const exercises: Exercise[] = await exerciseRepository.getAll();
      const mapped: Exercise[] = exercises.map((exercise) => exercise);
      if (!mountedRef.current) return;
      setOptions(mapped);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;

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
      mountedRef.current = false;
    };
  }, []);

  return { options, loading, refetch };
}
