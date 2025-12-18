import { ExerciseProgram } from "../../program-exercise/domain/type";
import { SessionSet } from "../../session-set/domain/types";
export type SessionExercise = {
  id: string;

  workoutSessionId: string;

  exerciseId: string | null;
  exerciseProgramId: string | null;
  exerciseProgram?: ExerciseProgram;

  // snapshot name for history
  exerciseName: string | null;

  orderIndex: number;

  note: string | null;
  strengthScore: number | null;
  strengthScoreVersion: number;

  createdAt: Date;
  updatedAt: Date;

  // relation: all sets for this exercise, ordered by orderIndex
  sets?: SessionSet[];
};
