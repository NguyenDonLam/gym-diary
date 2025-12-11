// src/features/session-workout/domain/type.ts

import { SessionExercise } from "../../session-exercise/domain/types";
import { WorkoutProgram } from "../../program-workout/domain/type";

export type SessionWorkout = {
  id: string;

  name: string | null;

  startedAt: Date;
  endedAt: Date | null;

  status: "in_progress" | "completed" | "discarded";

  sourceTemplateId: string | null;
  sourceTemplate?: WorkoutProgram;

  note: string | null;

  createdAt: Date;
  updatedAt: Date;

  exercises?: SessionExercise[];
};
