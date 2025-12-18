import type { InferSelectModel } from "drizzle-orm";
import { exercisePeriodStats } from "@/db/schema";

// adjust this import to your actual ExerciseRow type location
import type { ExerciseRow } from "@/src/features/exercise/data/types";

export type ExercisePeriodStatRow = InferSelectModel<
  typeof exercisePeriodStats
> & {
  exercise?: ExerciseRow;
};
