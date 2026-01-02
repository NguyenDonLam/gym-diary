// src/features/exercise-stat/hooks/use-exercise-stats.ts
import { useQuery } from "@tanstack/react-query";

import type { ExerciseStat } from "../domain/types";
import { exerciseStatRepository } from "../data/repository";

export const exerciseStatKeys = {
  all: ["exerciseStats"] as const,
};

export function useExerciseStats() {
  const query = useQuery<ExerciseStat[]>({
    queryKey: exerciseStatKeys.all,
    queryFn: () => exerciseStatRepository.getAll(),

    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const lookupExerciseStat = (() => {
    const out: Record<string, ExerciseStat> = {};
    if (query.data) {
      for (const s of query.data) out[s.exerciseId] = s;
    }
    return out;
  })();

  return {
    data: query.data ?? [],
    lookupExerciseStat,

    status: query.status,
    error: query.error,

    refresh: query.refetch,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
