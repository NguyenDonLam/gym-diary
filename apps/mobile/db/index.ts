// apps/mobile/db/index.ts
import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

export const DATABASE_NAME = "gym_diary.db";
export const expoDb = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDb, { schema });
