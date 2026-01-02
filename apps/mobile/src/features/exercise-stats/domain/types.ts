import type { Exercise } from "@packages/exercise";

export type ExerciseStat = {
  // FK to exercise (1:1 cache row)
  exerciseId: string;

  // Baseline exercise-level strength score used as a progression anchor.
  // Null until explicitly set or enough history exists.
  baselineExerciseStrengthScore: number | null;

  // Baseline best-set e1RM used as a progression anchor.
  // Null until explicitly set or enough history exists.
  baselineSetE1rm: number | null;

  // All-time best estimated 1RM observed for this exercise.
  bestSetE1rm: number | null;

  // All-time best exercise strength score observed.
  bestExerciseStrengthScore: number | null;

  // Lifetime count of performed sets for this exercise.
  totalSetCount: number;

  // Lifetime accumulated training volume in kilograms.
  totalVolumeKg: number;

  // Number of samples contributing to computed stats
  // (define consistently: e.g. scored sessions or valid e1RM sets).
  sampleCount: number;

  // Last time this cached stat row was recomputed.
  updatedAt: Date;

  // relations
  exercise?: Exercise;
};
