// src/features/session-workout/data/session-workout-repository.ts

import { eq, inArray } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { sessionExercises, sessionSets, workoutSessions } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { SessionWorkout } from "../domain/types";
import { SessionWorkoutRowFactory } from "./row-factory";
import { SessionWorkoutRow } from "./types";
import { WorkoutProgram } from "../../program-workout/domain/type";
import { SessionWorkoutFactory } from "../domain/factory";

export class SessionWorkoutRepository extends BaseRepository<SessionWorkout> {
  async get(id: string): Promise<SessionWorkout | null> {
    try {
      const session = await db.query.workoutSessions.findFirst({
        where: (ws, { eq }) => eq(ws.id, id),
        with: {
          sessionExercises: {
            with: {
              sessionSets: true,
            },
            orderBy: (se, { asc }) => [asc(se.orderIndex)],
          },
        },
      });

      if (!session) return null;

      return SessionWorkoutRowFactory.fromQuery(session);
    } catch (error) {
      console.error("SessionWorkoutRepository.get error:", error);
      throw error;
    }
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

    const { workout, exercises, sets } =
      SessionWorkoutRowFactory.toRowTree(withId);
    console.log(exercises)

    await db.transaction(async (tx) => {
      await tx.insert(workoutSessions).values(workout);

      if (exercises.length > 0) {
        await tx.insert(sessionExercises).values(exercises);
      }

      if (sets.length > 0) {
        await tx.insert(sessionSets).values(sets);
      }
    });

    return withId;
  }

  protected async update(
    entity: SessionWorkout & { id?: string | null }
  ): Promise<SessionWorkout> {
    if (!entity.id) {
      throw new Error("Cannot update SessionWorkout without id");
    }

    const withId = entity as SessionWorkout;

    const { workout, exercises, sets } =
      SessionWorkoutRowFactory.toRowTree(withId);

    await db.transaction(async (tx) => {
      // 1. update session row
      await tx
        .update(workoutSessions)
        .set(workout)
        .where(eq(workoutSessions.id, withId.id));

      // 2. delete existing children
      const existingExercises = await tx
        .select({ id: sessionExercises.id })
        .from(sessionExercises)
        .where(eq(sessionExercises.workoutSessionId, withId.id));

      const existingExerciseIds = existingExercises.map((r) => r.id);

      if (existingExerciseIds.length > 0) {
        await tx
          .delete(sessionSets)
          .where(inArray(sessionSets.sessionExerciseId, existingExerciseIds));

        await tx
          .delete(sessionExercises)
          .where(eq(sessionExercises.workoutSessionId, withId.id));
      }

      // 3. insert new children
      if (exercises.length > 0) {
        await tx.insert(sessionExercises).values(exercises);
      }

      if (sets.length > 0) {
        await tx.insert(sessionSets).values(sets);
      }
    });

    return withId;
  }

  async delete(id: string): Promise<void> {
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  async createFromTemplate(template: WorkoutProgram): Promise<SessionWorkout> {
    const session = SessionWorkoutFactory.fromTemplate(template);
    return this.save(session);
  }
}

export const sessionWorkoutRepository = new SessionWorkoutRepository();
