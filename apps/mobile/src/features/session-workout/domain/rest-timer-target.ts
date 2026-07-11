import type { SessionSet } from "../../session-set/domain/types";

type ExerciseWithSets = {
  id: string;
  workoutSessionId: string;
  exerciseName: string | null;
  orderIndex: number;
  sets?: SessionSet[];
};

export type RestTimerTarget = {
  set: SessionSet;
  sessionId: string;
  exerciseName: string | null;
  setIndex: number;
};

function sortByOrder<T extends { orderIndex: number }>(rows: T[]) {
  return rows.slice().sort((a, b) => a.orderIndex - b.orderIndex);
}

function flattenSessionSets(exercises: ExerciseWithSets[]) {
  return sortByOrder(exercises).flatMap((exercise) =>
    sortByOrder(exercise.sets ?? []).map((set, index) => ({
      set,
      sessionId: exercise.workoutSessionId,
      exerciseName: exercise.exerciseName,
      setIndex: index + 1,
    })),
  );
}

export function findRestTimerTargetForSet(
  exercises: ExerciseWithSets[],
  setId: string,
): RestTimerTarget | null {
  return (
    flattenSessionSets(exercises).find((target) => target.set.id === setId) ??
    null
  );
}
