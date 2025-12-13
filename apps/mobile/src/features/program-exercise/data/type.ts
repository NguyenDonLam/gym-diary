import type { InferSelectModel } from "drizzle-orm";
import { exercisePrograms, } from "@/db/schema";
import { SetProgramRow } from "../../program-set/data/type";
import { ExerciseRow } from "../../exercise/data/types";

export type ExerciseProgramRow = InferSelectModel<typeof exercisePrograms> & {
    sets?: SetProgramRow[];
    exercise?: ExerciseRow;
  };
