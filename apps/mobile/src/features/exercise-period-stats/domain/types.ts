import { PeriodType } from "@/db/enums";
import type { Exercise } from "@packages/exercise";

export type ExercisePeriodStat = {
  id: string;

  exerciseId: string;

  periodType: PeriodType;

  // start of bucket
  periodStart: Date;

  sessionCount: number;

  // Count of performed sets for this exercise.
  totalSetCount: number;

  // Count of performed reps for this exercise.
  totalQuantity: number;

  bestStrengthScore: number | null;
  medianStrengthScore: number | null;

  bestSetE1rm: number | null;
  medianSetE1rm: number | null;

  updatedAt: Date;

  // relations
  exercise?: Exercise;
};
