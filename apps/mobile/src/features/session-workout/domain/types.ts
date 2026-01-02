// src/features/session-workout/domain/type.ts

import { SessionExercise } from "../../session-exercise/domain/types";
import { WorkoutProgram } from "../../program-workout/domain/type";
import { ProgramColor } from "@/db/enums";

export type SessionWorkout = {
  id: string;

  name: string | null;
  color: ProgramColor

  startedAt: Date;
  endedAt: Date | null;

  status: SessionStatus;

  sourceProgramId: string | null;
  sourceProgram?: WorkoutProgram;

  note: string | null;
  strengthScore: number | null,
  strengthScoreVersion: number,
  

  createdAt: Date;
  updatedAt: Date;

  exercises?: SessionExercise[];
};

export type SessionStatus = "in_progress" | "completed" | "discarded";
