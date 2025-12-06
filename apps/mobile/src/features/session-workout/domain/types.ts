// src/features/session-workout/domain/type.ts

import { SessionExercise } from "../../session-exercise/domain/types";
import { TemplateWorkout } from "../../template-workout/domain/type";

export type SessionWorkout = {
  id: string;

  startedAt: Date;
  endedAt: Date | null;

  sourceTemplateId: string | null;
  sourceTemplate?: TemplateWorkout;

  note: string | null;

  createdAt: Date;
  updatedAt: Date;

  // relation: all exercises in this session, ordered by orderIndex
  exercises?: SessionExercise[];
};
