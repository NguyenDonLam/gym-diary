import type { InferSelectModel } from "drizzle-orm";
import { setPrograms } from "@/db/schema"; // adjust to your table

import type { ExerciseProgramRow } from "@/src/features/program-exercise/data/type";
import { LoadUnit } from "@/db/enums";

type SetProgramBaseRow = InferSelectModel<typeof setPrograms>;

export type SetProgramRow = SetProgramBaseRow & {
  loadUnit: LoadUnit;
  exerciseProgram?: ExerciseProgramRow | null;
};
