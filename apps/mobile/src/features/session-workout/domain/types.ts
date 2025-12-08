// src/features/session-workout/domain/type.ts

import { SessionExercise } from "../../session-exercise/domain/types";
import { WorkoutProgram } from "../../program-workout/domain/type";

export type SessionWorkout = {
  id: string;

  startedAt: Date;
  endedAt: Date | null;

  sourceTemplateId: string | null;
  sourceTemplate?: WorkoutProgram;

  note: string | null;

  createdAt: Date;
  updatedAt: Date;

  // relation: all exercises in this session, ordered by orderIndex
  exercises?: SessionExercise[];
};
