// src/features/program-set/data/type.ts

import type { LoadUnit } from "@/src/features/program-set/domain/type";
import type { InferSelectModel } from "drizzle-orm";
import { setPrograms } from "@/db/schema"; // adjust to your table

import type { ExerciseProgramRow } from "@/src/features/program-exercise/data/type";

type SetProgramBaseRow = InferSelectModel<typeof setPrograms>;

export type SetProgramRow = SetProgramBaseRow & {
  loadUnit: LoadUnit;
  exerciseProgram?: ExerciseProgramRow | null;
};
