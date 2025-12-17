// apps/mobile/domain/exercise/type.ts

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { exercises } from "@/db/schema";
import { Exercise } from "@packages/exercise";

/**
 * Raw DB row type from Drizzle.
 */
export type ExerciseRow = InferSelectModel<typeof exercises>;

/**
 * Insert/update payload type for Drizzle.
 */
export type NewExerciseRow = InferInsertModel<typeof exercises>;

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
export const toRow = (exercise: Exercise): NewExerciseRow => {
  return {
    id: exercise.id,
    name: exercise.name,
    createdAt: exercise.createdAt.toISOString(),
    updatedAt: exercise.updatedAt.toISOString(),
  } as NewExerciseRow;
};
