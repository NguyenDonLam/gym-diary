// src/features/session-workout/data/types.ts (or wherever you keep these)

import type { InferSelectModel } from "drizzle-orm";
import { workoutSessions } from "@/db/schema";

import type { SessionExerciseRow } from "@/src/features/session-exercise/data/types";
import type { SessionSetRow } from "@/src/features/session-set/data/types";
import { SetProgramRow } from "../../program-set/data/type";
import { WorkoutProgramRow } from "../../program-workout/data/type";

// Base row
type SessionWorkoutBaseRow = InferSelectModel<typeof workoutSessions>;

// Single exported type that can represent:
// - plain row (relations absent)
// - row with nested relations (relations present)
export type SessionWorkoutRow = SessionWorkoutBaseRow & {
  sessionExercises?: (SessionExerciseRow & {
    sessionSets?: (SessionSetRow & { setProgram?: SetProgramRow | null })[];
  })[];
  sourceProgram?: WorkoutProgramRow | null;
};
