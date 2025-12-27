import type { InferSelectModel } from "drizzle-orm";
import { programPeriodStats } from "@/db/schema";
import { WorkoutProgramRow } from "../../program-workout/data/type";

export type ProgramPeriodStatRow = InferSelectModel<
  typeof programPeriodStats
> & {
  // relations
  program?: WorkoutProgramRow;
};
