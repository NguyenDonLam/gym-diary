import { workoutSessions } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type SessionWorkoutRow = InferSelectModel<typeof workoutSessions>;