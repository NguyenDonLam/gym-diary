import type { InferSelectModel } from "drizzle-orm";
import { exerciseStats } from "@/db/schema";

import type { ExerciseRow } from "@/src/features/exercise/data/types";

export type ExerciseStatRow = InferSelectModel<typeof exerciseStats> & {
  exercise?: ExerciseRow;
};
