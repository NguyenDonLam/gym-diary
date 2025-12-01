

import { DEFAULT_EXERCISES } from "@packages/exercise";
import { exercises } from "../schema";
import { eq } from "drizzle-orm";

export async function seedDefaultExercises(db: any) {
  const now = new Date().toISOString();

  for (const ex of DEFAULT_EXERCISES) {
    const existing = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.id, ex.id))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(exercises).values({
      id: ex.id,
      name: ex.name,
      createdAt: now,
      updatedAt: now,
      // isCustom: false,  // if you have this column
    });
  }
}
