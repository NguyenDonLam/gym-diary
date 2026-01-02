import type { InferSelectModel } from "drizzle-orm";
import type { WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { programStats } from "@/db/schema";

export type ProgramStatRow = InferSelectModel<typeof programStats> & {
  // relations
  program?: WorkoutProgram;
};
