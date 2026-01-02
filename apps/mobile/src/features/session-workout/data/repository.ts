// src/features/session-workout/data/session-workout-repository.ts

import { and, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { sessionExercises, sessionSets, workoutSessions } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { SessionWorkout } from "../domain/types";
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
              sessionSets: {
                with: {
                  setProgram: true,
                },
              },
            },
            orderBy: (se, { asc }) => [asc(se.orderIndex)],
          },
        },
      });

      if (!session) return null;

      return SessionWorkoutFactory.domainFromDb(session);
    } catch (error) {
      console.error("SessionWorkoutRepository.get error:", error);
      throw error;
    }
  }

  async getAll(): Promise<SessionWorkout[]> {
    const rows: SessionWorkoutRow[] = await db.select().from(workoutSessions);
    return rows.map((row) => SessionWorkoutFactory.domainFromDb(row));
  }

  async getCompleted(): Promise<SessionWorkout[]> {
    const rows: SessionWorkoutRow[] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.status, "completed"));

    return rows.map((row) => SessionWorkoutFactory.domainFromDb(row));
  }

  /**
   * Inclusive start, exclusive end. Pass ISO strings.
   * Use startedAt if want "the day it was performed".
   * If your schema doesn't have startedAt, switch to endedAt.
   */
  async getCompletedInRange(
    startISO: string,
    endISO: string
  ): Promise<SessionWorkout[]> {
    const rows = await db.query.workoutSessions.findMany({
      where: (ws, { and, eq, gte, lt, isNotNull }) =>
        and(
          eq(ws.status, "completed"),
          isNotNull(ws.startedAt),
          gte(ws.startedAt, startISO),
          lt(ws.startedAt, endISO)
        ),
      with: {
        sourceProgram: true,
        sessionExercises: {
          // if nested orderBy is unsupported in your drizzle version, delete these orderBy blocks
          orderBy: (se, { asc }) => [asc(se.orderIndex)],
          with: {
            sessionSets: {
              orderBy: (ss, { asc }) => [asc(ss.orderIndex)],
            },
          },
        },
      },
      orderBy: (ws, { asc }) => [asc(ws.startedAt)],
    });

    return rows.map((row) => SessionWorkoutFactory.domainFromDb(row));
  }

  protected async insert(
    entity: SessionWorkout & { id?: string | null }
  ): Promise<SessionWorkout> {
    const id = entity.id ?? generateId();
    const withId: SessionWorkout = { ...entity, id };

    const { workout, exercises, sets } =
      SessionWorkoutFactory.dbFromDomain(withId);

    await db.transaction(async (tx) => {
      await tx.insert(workoutSessions).values(workout);

      if (exercises !== undefined && exercises.length > 0) {
        await tx.insert(sessionExercises).values(exercises);
      }

      if (sets !== undefined && sets.length > 0) {
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

    const withId = entity;
    const { workout, exercises, sets } =
      SessionWorkoutFactory.dbFromDomain(withId);

    await db.transaction(async (tx) => {
      // 1. update session row
      await tx
        .update(workoutSessions)
        .set(workout)
        .where(eq(workoutSessions.id, withId.id!));

      // GUARD: if caller did not provide exercises, don't touch children
      if (withId.exercises === undefined) return;

      // 2. delete existing children
      const existingExercises = await tx
        .select({ id: sessionExercises.id })
        .from(sessionExercises)
        .where(eq(sessionExercises.workoutSessionId, withId.id!));

      const existingExerciseIds = existingExercises.map((r) => r.id);

      // 3. insert new children
      if (exercises !== undefined && exercises.length > 0) {
        if (existingExerciseIds.length > 0) {
          await tx
            .delete(sessionExercises)
            .where(eq(sessionExercises.workoutSessionId, withId.id!));
        }
        await tx.insert(sessionExercises).values(exercises);
      }

      if (sets !== undefined && sets.length > 0) {
        await tx
          .delete(sessionSets)
          .where(inArray(sessionSets.sessionExerciseId, existingExerciseIds));
        
        await tx.insert(sessionSets).values(sets);
      }
    });

    return withId as SessionWorkout;
  }

  async delete(id: string): Promise<void> {
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  async createFromTemplate(template: WorkoutProgram): Promise<SessionWorkout> {
    const session = SessionWorkoutFactory.domainFromProgram(template);
    return this.save(session);
  }

  async finish(id: string, endedAt?: string): Promise<void> {
    const endedAtValue = endedAt ?? new Date().toISOString();

    await db
      .update(workoutSessions)
      .set({
        status: "completed",
        endedAt: endedAtValue,
        updatedAt: endedAtValue,
      })
      .where(eq(workoutSessions.id, id));
  }

  async discard(id: string): Promise<void> {
    const now = new Date().toISOString();

    await db
      .update(workoutSessions)
      .set({
        status: "discarded",
        updatedAt: now,
      })
      .where(eq(workoutSessions.id, id));
  }
}

export const sessionWorkoutRepository = new SessionWorkoutRepository();
