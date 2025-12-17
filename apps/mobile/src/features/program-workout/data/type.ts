// src/features/program-workout/data/type.ts

import type { InferSelectModel } from "drizzle-orm";
import { workoutPrograms } from "@/db/schema";

import type { ExerciseProgramRow } from "@/src/features/program-exercise/data/type";

/**
 * Plain row OR hydrated row (relations optional).
 *
 * Relations:
 * - exercisePrograms: children in this workout program (ordered by orderIndex)
 *
 * Note: ExerciseProgramRow already carries:
 * - sets?: SetProgramRow[]
 * - exercise?: ExerciseRow | null
 * so hydrating workoutProgram.exercisePrograms can include the whole tree.
 */
export type WorkoutProgramRow = InferSelectModel<typeof workoutPrograms> & {
  exercisePrograms?: ExerciseProgramRow[];
};
