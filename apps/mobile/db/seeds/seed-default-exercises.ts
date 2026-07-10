

import { DEFAULT_EXERCISES } from "@gym-diary/exercise";
import { exercises } from "../schema";
import { eq } from "drizzle-orm";

export async function seedDefaultExercises(db: any) {
  const now = new Date().toISOString();

  for (const ex of DEFAULT_EXERCISES) {
    const existing = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        quantityUnit: exercises.quantityUnit,
      })
      .from(exercises)
      .where(eq(exercises.id, ex.id))
      .limit(1);

    if (existing.length > 0) {
      const updates: Partial<{
        name: string;
        quantityUnit: typeof ex.quantityUnit;
        updatedAt: string;
      }> = {};

      if (existing[0]?.name !== ex.name) {
        updates.name = ex.name;
      }

      if (existing[0]?.quantityUnit !== ex.quantityUnit) {
        updates.quantityUnit = ex.quantityUnit;
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(exercises)
          .set({
            ...updates,
            updatedAt: now,
          })
          .where(eq(exercises.id, ex.id));
      }

      continue;
    }

    await db.insert(exercises).values({
      id: ex.id,
      name: ex.name,
      quantityUnit: ex.quantityUnit,
      createdAt: now,
      updatedAt: now,
      // isCustom: false,  // if you have this column
    });
  }
}
