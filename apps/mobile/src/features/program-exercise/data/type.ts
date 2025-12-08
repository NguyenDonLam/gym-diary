import { exercisePrograms } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type ExerciseProgramRow = InferSelectModel<typeof exercisePrograms>;