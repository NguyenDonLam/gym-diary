// apps/mobile/domain/exercise/type.ts

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { exercises } from "@/db/schema";
import { Exercise } from "@packages/exercise";
import { ExerciseProgram } from "../../program-exercise/domain/type";
import { SessionExerciseRow } from "../../session-exercise/data/types";
import { ExerciseProgramRow } from "../../program-exercise/data/type";
import { ExerciseStatRow } from "../../exercise-stats/data/types";
import { ExercisePeriodStatRow } from "../../exercise-period-stats/data/types";

/**
 * Raw DB row type from Drizzle.
 */
export type ExerciseRow = InferSelectModel<typeof exercises> & {
  // relations
  programExercises?: ExerciseProgramRow[];
  sessionExercises?: SessionExerciseRow[];

  stat?: ExerciseStatRow | null;
  periodStats?: ExercisePeriodStatRow[];
};

/**
 * Map a Drizzle row to the shared domain Exercise type.
 *
 * You MUST fill the field mappings to match your actual schema.
 */
export const toDomain = (row: ExerciseRow): Exercise => {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  } as Exercise;
};


/**
 * Map a domain Exercise to the Drizzle insert/update shape.
 *
 * You MUST fill the field mappings to match your actual schema.
 */
export const toRow = (exercise: Exercise): ExerciseRow => {
  return {
    id: exercise.id,
    name: exercise.name,
    createdAt: exercise.createdAt.toISOString(),
    updatedAt: exercise.updatedAt.toISOString(),
  } as ExerciseRow;
};
