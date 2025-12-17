// domain/exercise/exercise-repository.ts

import { eq, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exercises } from "@/db/schema";
import { db } from "@/db";
import { toDomain, toRow } from "./types";
import { generateId } from "@/src/lib/id";
import { Exercise } from "@packages/exercise";

type ExerciseRow = InferSelectModel<typeof exercises>;
type NewExerciseRow = InferInsertModel<typeof exercises>;

export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor(
    private readonly toDomain: (row: ExerciseRow) => Exercise,
    private readonly toRow: (entity: Exercise) => NewExerciseRow
  ) {
    super();
  }

  async get(id: string): Promise<Exercise | null> {
    const rows = await db
      .select()
      .from(exercises)
      // replace `exercises.id` with your actual PK column
      .where(eq(exercises.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async getAll(): Promise<Exercise[]> {
    const rows = await db.select().from(exercises);
    return rows.map(this.toDomain);
  }

  protected async insert(
    entity: Exercise & { id?: string | null }
  ): Promise<Exercise> {
    const id = entity.id ?? generateId();
    const withId: Exercise = { ...(entity as Exercise), id };

    const row = this.toRow(withId);
    await db.insert(exercises).values(row);

    return withId;
  }

  protected async update(
    entity: Exercise & { id?: string | null }
  ): Promise<Exercise> {
    if (!entity.id) {
      throw new Error("Cannot update Exercise without id");
    }

    const row = this.toRow(entity as Exercise);

    await db
      .update(exercises)
      .set(row)
      // replace `exercises.id` with your actual PK column
      .where(eq(exercises.id, entity.id));

    return entity as Exercise;
  }

  async delete(id: string): Promise<void> {
    await db
      .delete(exercises)
      // replace `exercises.id` with your actual PK column
      .where(eq(exercises.id, id));
  }
}

// domain/exercise/index.ts
export const exerciseRepository = new ExerciseRepository(toDomain, toRow);
