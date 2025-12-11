import { sessionSets } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type SessionSetRow = InferSelectModel<typeof sessionSets>;
