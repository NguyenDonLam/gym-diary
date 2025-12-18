import { ExercisePeriodStat } from "@/src/features/exercise-period-stats/domain/types";
import { ExerciseStat } from "@/src/features/exercise-stats/domain/types";
import { ExerciseProgram } from "@/src/features/program-exercise/domain/type";
import { SessionExercise } from "@/src/features/session-exercise/domain/types";

// TODO: Add full type later
export type Exercise = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // relations
  programExercises?: ExerciseProgram[];
  sessionExercises?: SessionExercise[];

  stat?: ExerciseStat | null;
  periodStats?: ExercisePeriodStat[];
};