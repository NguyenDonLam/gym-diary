// src/features/session-exercise/data/session-exercise-repository.ts

import type { SessionExercise } from "../domain/types";

import { eq, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { sessionExercises } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { SessionExerciseFactory } from "./factory";

type SessionExerciseRow = InferSelectModel<typeof sessionExercises>;
type NewSessionExerciseRow = InferInsertModel<typeof sessionExercises>;

export class SessionExerciseRepository extends BaseRepository<SessionExercise> {
  constructor() {
    super();
  }

  async get(id: string): Promise<SessionExercise | null> {
    const rows: SessionExerciseRow[] = await db
      .select()
      .from(sessionExercises)
      .where(eq(sessionExercises.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // no relations here, so just row -> domain
    return SessionExerciseFactory.toDomain(row);
  }

  async getAll(): Promise<SessionExercise[]> {
    const rows: SessionExerciseRow[] = await db.select().from(sessionExercises);
    return rows.map((row) => SessionExerciseFactory.toDomain(row));
  }

  protected async insert(
    entity: SessionExercise & { id?: string | null }
  ): Promise<SessionExercise> {
    const id = entity.id ?? generateId();
    const withId: SessionExercise = { ...(entity as SessionExercise), id };

    const row: NewSessionExerciseRow = SessionExerciseFactory.toRow(
      withId
    ) as NewSessionExerciseRow;

    await db.insert(sessionExercises).values(row);

    return withId;
  }

  protected async update(
    entity: SessionExercise & { id?: string | null }
  ): Promise<SessionExercise> {
    if (!entity.id) {
      throw new Error("Cannot update SessionExercise without id");
    }

    const row: NewSessionExerciseRow = SessionExerciseFactory.toRow(
      entity as SessionExercise
    ) as NewSessionExerciseRow;

    await db
      .update(sessionExercises)
      .set(row)
      .where(eq(sessionExercises.id, entity.id));

    return entity as SessionExercise;
  }

  async delete(id: string): Promise<void> {
    await db.delete(sessionExercises).where(eq(sessionExercises.id, id));
  }
}

export const sessionExerciseRepository = new SessionExerciseRepository();
