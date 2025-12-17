// src/features/program-exercise/data/type.ts

import type { InferSelectModel } from "drizzle-orm";
import { exercisePrograms } from "@/db/schema";

import type { SetProgramRow } from "@/src/features/program-set/data/type";
import type { ExerciseRow } from "@/src/features/exercise/data/types";

// adjust this import to wherever your workout-program row type lives
import type { WorkoutProgramRow } from "@/src/features/program-workout/data/type";

type ExerciseProgramBaseRow = InferSelectModel<typeof exercisePrograms>;

/**
 * Plain row OR hydrated row (relations optional).
 * Covers:
 *  - sets (setPrograms)
 *  - exercise (canonical exercise)
 *  - workoutProgram (parent program)
 *
 * Note: SetProgramRow already covers its optional back-relation:
 *   SetProgramRow.exerciseProgram?: ExerciseProgramRow
 * so nested relations are preserved automatically.
 */
export type ExerciseProgramRow = ExerciseProgramBaseRow & {
  sets?: SetProgramRow[];
  exercise?: ExerciseRow | null;
  workoutProgram?: WorkoutProgramRow | null;
};
