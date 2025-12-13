// src/features/template-set/data/type.ts

import type { InferSelectModel } from "drizzle-orm";
import { setPrograms } from "@/db/schema";
import type { ExerciseProgramRow } from "../../program-exercise/data/type";

export type SetProgramRow = InferSelectModel<typeof setPrograms> & {
  exerciseProgram?: ExerciseProgramRow;
};
