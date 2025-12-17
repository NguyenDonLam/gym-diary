// src/features/session-exercise/data/types.ts

import type { InferSelectModel } from "drizzle-orm";
import { sessionExercises } from "@/db/schema";

import type { SessionSetRow } from "@/src/features/session-set/data/types";
import type { ExerciseProgramRow } from "@/src/features/program-exercise/data/type";
import type { ExerciseRow } from "@/src/features/exercise/data/types";

type SessionExerciseBaseRow = InferSelectModel<typeof sessionExercises>;

// Plain row OR hydrated row (relations optional)
export type SessionExerciseRow = SessionExerciseBaseRow & {
  sessionSets?: SessionSetRow[];

  // include these only when your query `with:` loads them
  exerciseProgram?: ExerciseProgramRow | null;
  exercise?: ExerciseRow | null;
};
