import { InferSelectModel } from "drizzle-orm";
import { workoutPrograms } from "@/db/schema";

export type WorkoutProgramRow = InferSelectModel<typeof workoutPrograms>;
