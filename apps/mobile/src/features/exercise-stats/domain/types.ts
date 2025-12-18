import type { Exercise } from "@packages/exercise";

export type ExerciseStat = {
  exerciseId: string;

  // rolling baselines (null until enough history exists)
  baselineExerciseStrengthScore: number | null;
  baselineSetE1rm: number | null;

  sampleCount: number;

  updatedAt: Date;

  // relations
  exercise?: Exercise;
};
