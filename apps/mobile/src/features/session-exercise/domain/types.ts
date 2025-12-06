import { SessionSet } from "../../session-set/domain/types";
import { TemplateExercise } from "../../template-exercise/domain/type";

export type SessionExercise = {
  id: string;

  workoutSessionId: string;

  exerciseId: string | null;
  templateExerciseId: string | null;
  templateExercise?: TemplateExercise;

  // snapshot name for history
  exerciseName: string | null;

  orderIndex: number;

  note: string | null;

  createdAt: Date;
  updatedAt: Date;

  // relation: all sets for this exercise, ordered by orderIndex
  sets?: SessionSet[];
};
