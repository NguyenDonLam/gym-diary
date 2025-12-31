// src/features/exercise-stat/data/exercise-stat-repository.ts

import type { ExerciseStat } from "../domain/types";

import { and, eq, isNotNull } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import {
  exercises,
  exerciseStats,
  workoutSessions,
  sessionExercises,
  sessionSets,
} from "@/db/schema";
import { db } from "@/db";

import type { ExerciseStatRow } from "./types";
import { ExerciseStatFactory } from "../domain/factory";

const LB_TO_KG = 0.45359237;

export class ExerciseStatRepository extends BaseRepository<ExerciseStat> {
  async get(exerciseId: string): Promise<ExerciseStat | null> {
    const rows: ExerciseStatRow[] = await db
      .select()
      .from(exerciseStats)
      .where(eq(exerciseStats.exerciseId, exerciseId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ExerciseStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ExerciseStat[]> {
    const rows: ExerciseStatRow[] = await db.select().from(exerciseStats);
    return rows.map((r) => ExerciseStatFactory.domainFromDb(r));
  }

  protected async insert(entity: ExerciseStat): Promise<ExerciseStat> {
    const row = ExerciseStatFactory.dbFromDomain(entity);
    await db.insert(exerciseStats).values(row);
    return entity;
  }

  protected async update(entity: ExerciseStat): Promise<ExerciseStat> {
    const row = ExerciseStatFactory.dbFromDomain(entity);

    await db
      .update(exerciseStats)
      .set(row)
      .where(eq(exerciseStats.exerciseId, entity.exerciseId));

    return entity;
  }

  async delete(exerciseId: string): Promise<void> {
    await db
      .delete(exerciseStats)
      .where(eq(exerciseStats.exerciseId, exerciseId));
  }

  async save(entity: ExerciseStat): Promise<ExerciseStat> {
    const existing = await this.get(entity.exerciseId);
    if (existing) return this.update(entity);
    return this.insert(entity);
  }

  /**
   * Maintenance-only: recompute lifetime stats for ALL exercises.
   * Creates/updates an `exercise_stats` row for every exercise, including exercises with zero sessions/sets.
   *
   * Policy:
   * - sets counted only when isCompleted=true AND isWarmup=false
   * - volume counted only when load is numeric and unit is kg/lb and reps > 0
   * - bestSetE1rm from completed + non-warmup sets with numeric e1rm
   * - bestExerciseStrengthScore from session_exercises.strengthScore in completed sessions
   * - baselines preserved from existing rows (not recomputed here)
   */
  async computeLifetimeStat(): Promise<void> {
    const now = new Date();

    // all exercise's id
    const exRows = await db.select({ id: exercises.id }).from(exercises);

    // existing stats
    const existing = await db
      .select({
        exerciseId: exerciseStats.exerciseId,
        baselineExerciseStrengthScore:
          exerciseStats.baselineExerciseStrengthScore,
        baselineSetE1rm: exerciseStats.baselineSetE1rm,
      })
      .from(exerciseStats);

    const scoreLookup = new Map<
      string,
      {
        baselineExerciseStrengthScore: number | null;
        baselineSetE1rm: number | null;
      }
    >(
      existing.map((r) => [
        r.exerciseId,
        {
          baselineExerciseStrengthScore:
            r.baselineExerciseStrengthScore ?? null,
          baselineSetE1rm: r.baselineSetE1rm ?? null,
        },
      ])
    );

    const accumulator: Record<
      string,
      {
        setCount: number;
        vol: number;
        bestE1rm: number | null;
        bestStrength: number | null;
        sampleCount: number;
      }
    > = {};

    for (const e of exRows) {
      accumulator[e.id] = {
        setCount: 0,
        vol: 0,
        bestE1rm: null,
        bestStrength: null,
        sampleCount: 0,
      };
    }

    // session-exercise samples + best exercise strength score
    const se = await db
      .select({
        exerciseId: sessionExercises.exerciseId,
        strengthScore: sessionExercises.strengthScore,
      })
      .from(sessionExercises)
      .innerJoin(
        workoutSessions,
        eq(workoutSessions.id, sessionExercises.workoutSessionId)
      )
      .where(
        and(
          eq(workoutSessions.status, "completed"),
          isNotNull(sessionExercises.exerciseId)
        )
      );

    for (const r of se) {
      const exerciseId = r.exerciseId;
      if (!exerciseId) continue;

      const a = accumulator[exerciseId];
      if (!a) continue;

      a.sampleCount += 1;

      if (
        typeof r.strengthScore === "number" &&
        Number.isFinite(r.strengthScore)
      ) {
        a.bestStrength =
          a.bestStrength == null
            ? r.strengthScore
            : Math.max(a.bestStrength, r.strengthScore);
      }
    }

    // sets: count/volume/best e1rm (scoped to completed sessions)
    const sets = await db
      .select({
        exerciseId: sessionExercises.exerciseId,
        isCompleted: sessionSets.isCompleted,
        isWarmup: sessionSets.isWarmup,
        quantity: sessionSets.quantity,
        loadUnit: sessionSets.loadUnit,
        loadValue: sessionSets.loadValue,
        e1rm: sessionSets.e1rm,
      })
      .from(sessionSets)
      .innerJoin(
        sessionExercises,
        eq(sessionExercises.id, sessionSets.sessionExerciseId)
      )
      .innerJoin(
        workoutSessions,
        eq(workoutSessions.id, sessionExercises.workoutSessionId)
      )
      .where(
        and(
          eq(workoutSessions.status, "completed"),
          isNotNull(sessionExercises.exerciseId)
        )
      );

    for (const set of sets) {
      const exerciseId = set.exerciseId;
      if (!exerciseId) continue;

      const a = accumulator[exerciseId];
      if (!a) continue;

      if (!set.isCompleted) continue;
      if (set.isWarmup) continue;

      a.setCount += 1;

      if (typeof set.e1rm === "number" && Number.isFinite(set.e1rm)) {
        a.bestE1rm = a.bestE1rm == null ? set.e1rm : Math.max(a.bestE1rm, set.e1rm);
      }

      const reps = set.quantity ?? null;
      if (reps == null || !Number.isFinite(reps) || reps <= 0) continue;

      const rawStr = (set.loadValue ?? "").trim();
      if (!rawStr) continue;

      const raw = Number.parseFloat(rawStr);
      if (!Number.isFinite(raw) || raw <= 0) continue;

      const loadKg =
        set.loadUnit === "kg" ? raw : set.loadUnit === "lb" ? raw * LB_TO_KG : null;

      if (loadKg == null || !Number.isFinite(loadKg) || loadKg <= 0) continue;

      a.vol += loadKg * reps;
    }

    for (const e of exRows) {
      const a = accumulator[e.id] ?? {
        setCount: 0,
        vol: 0,
        bestE1rm: null,
        bestStrength: null,
        sampleCount: 0,
      };

      const b = scoreLookup.get(e.id) ?? {
        baselineExerciseStrengthScore: null,
        baselineSetE1rm: null,
      };

      await db
        .insert(exerciseStats)
        .values({
          exerciseId: e.id,

          baselineExerciseStrengthScore: b.baselineExerciseStrengthScore,
          baselineSetE1rm: b.baselineSetE1rm,

          bestSetE1rm: a.bestE1rm,
          bestExerciseStrengthScore: a.bestStrength,
          totalSetCount: a.setCount,
          totalVolumeKg: a.vol,

          sampleCount: a.sampleCount,

          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: exerciseStats.exerciseId,
          set: {
            baselineExerciseStrengthScore: b.baselineExerciseStrengthScore,
            baselineSetE1rm: b.baselineSetE1rm,

            bestSetE1rm: a.bestE1rm,
            bestExerciseStrengthScore: a.bestStrength,
            totalSetCount: a.setCount,
            totalVolumeKg: a.vol,

            sampleCount: a.sampleCount,

            updatedAt: now,
          },
        });
    }
  }
}

export const exerciseStatRepository = new ExerciseStatRepository();
