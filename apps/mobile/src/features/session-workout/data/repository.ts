// src/features/session-workout/data/session-workout-repository.ts

import { eq } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { workoutSessions } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { SessionWorkout } from "../domain/types";
import { SessionWorkoutRowFactory } from "./row-factory";
import { SessionWorkoutRow } from "./types";
import { WorkoutProgram } from "../../program-workout/domain/type";
import { SessionWorkoutFactory } from "../domain/factory";

export class SessionWorkoutRepository extends BaseRepository<SessionWorkout> {
  async get(id: string): Promise<SessionWorkout | null> {
    const rows: SessionWorkoutRow[] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // no relations loaded here; just row -> domain
    return SessionWorkoutRowFactory.toDomain(row);
  }

  async getAll(): Promise<SessionWorkout[]> {
    const rows: SessionWorkoutRow[] = await db.select().from(workoutSessions);
    return rows.map((row) => SessionWorkoutRowFactory.toDomain(row));
  }

  protected async insert(
    entity: SessionWorkout & { id?: string | null }
  ): Promise<SessionWorkout> {
    const id = entity.id ?? generateId();
    const withId: SessionWorkout = { ...(entity as SessionWorkout), id };

    const row: SessionWorkoutRow = SessionWorkoutRowFactory.toRow(
      withId
    ) as SessionWorkoutRow;

    await db.insert(workoutSessions).values(row);

    return withId;
  }

  protected async update(
    entity: SessionWorkout & { id?: string | null }
  ): Promise<SessionWorkout> {
    if (!entity.id) {
      throw new Error("Cannot update SessionWorkout without id");
    }

    const row: SessionWorkoutRow = SessionWorkoutRowFactory.toRow(
      entity as SessionWorkout
    ) as SessionWorkoutRow;

    await db
      .update(workoutSessions)
      .set(row)
      .where(eq(workoutSessions.id, entity.id));

    return entity as SessionWorkout;
  }

  async delete(id: string): Promise<void> {
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  async createFromTemplate(template: WorkoutProgram): Promise<SessionWorkout> {
    const session = SessionWorkoutFactory.fromTemplate(template);
    return this.insert(session);
  }
}

export const sessionWorkoutRepository = new SessionWorkoutRepository();
