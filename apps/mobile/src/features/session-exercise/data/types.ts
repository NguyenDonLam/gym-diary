import { sessionExercises } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type SessionExerciseRow = InferSelectModel<typeof sessionExercises>;
