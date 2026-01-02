// src/features/exercise-stat/data/exercise-stat-repository.ts

import type { ExerciseStat } from "../domain/types";

import { and, eq, isNotNull, or, sql } from "drizzle-orm";
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

    const exRows = await db.select({ id: exercises.id }).from(exercises);

    const baselines = await db
      .select({
        exerciseId: exerciseStats.exerciseId,
        baselineExerciseStrengthScore:
          exerciseStats.baselineExerciseStrengthScore,
        baselineSetE1rm: exerciseStats.baselineSetE1rm,
      })
      .from(exerciseStats);

    const baselineById = new Map(
      baselines.map((r) => [
        r.exerciseId,
        {
          baselineExerciseStrengthScore:
            r.baselineExerciseStrengthScore ?? null,
          baselineSetE1rm: r.baselineSetE1rm ?? null,
        },
      ])
    );

    const seAgg = await db
      .select({
        exerciseId: sessionExercises.exerciseId,
        sampleCount: sql<number>`count(*)`,
        bestStrength: sql<
          number | null
        >`max(${sessionExercises.strengthScore})`,
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
      )
      .groupBy(sessionExercises.exerciseId);

    const seById = new Map(
      seAgg.map((r) => [
        r.exerciseId!,
        { sampleCount: r.sampleCount, bestStrength: r.bestStrength ?? null },
      ])
    );

    const setAgg = await db
      .select({
        exerciseId: sessionExercises.exerciseId,
        setCount: sql<number>`count(*)`,
        bestE1rm: sql<number | null>`max(${sessionSets.e1rm})`,
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
          isNotNull(sessionExercises.exerciseId),
          eq(sessionSets.isCompleted, true),
          eq(sessionSets.isWarmup, false)
        )
      )
      .groupBy(sessionExercises.exerciseId);

    const setById = new Map(
      setAgg.map((r) => [
        r.exerciseId!,
        { setCount: r.setCount, bestE1rm: r.bestE1rm ?? null },
      ])
    );

    const volAgg = await db
      .select({
        exerciseId: sessionExercises.exerciseId,
        vol: sql<number>`coalesce(sum(
        (case
          when ${sessionSets.loadUnit} = 'kg'
            then cast(${sessionSets.loadValue} as real)
          else cast(${sessionSets.loadValue} as real) * ${LB_TO_KG}
        end) * ${sessionSets.quantity}
      ), 0)`,
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
          isNotNull(sessionExercises.exerciseId),
          eq(sessionSets.isCompleted, true),
          eq(sessionSets.isWarmup, false),
          sql`${sessionSets.quantity} > 0`,
          isNotNull(sessionSets.loadValue),
          sql`trim(${sessionSets.loadValue}) <> ''`,
          sql`cast(${sessionSets.loadValue} as real) > 0`,
          or(eq(sessionSets.loadUnit, "kg"), eq(sessionSets.loadUnit, "lb"))
        )
      )
      .groupBy(sessionExercises.exerciseId);

    const volById = new Map(volAgg.map((r) => [r.exerciseId!, r.vol]));

    for (const e of exRows) {
      const b = baselineById.get(e.id) ?? {
        baselineExerciseStrengthScore: null,
        baselineSetE1rm: null,
      };
      const se = seById.get(e.id) ?? { sampleCount: 0, bestStrength: null };
      const st = setById.get(e.id) ?? { setCount: 0, bestE1rm: null };
      const vol = volById.get(e.id) ?? 0;

      await db
        .insert(exerciseStats)
        .values({
          exerciseId: e.id,
          baselineExerciseStrengthScore: b.baselineExerciseStrengthScore,
          baselineSetE1rm: b.baselineSetE1rm,
          bestSetE1rm: st.bestE1rm,
          bestExerciseStrengthScore: se.bestStrength,
          totalSetCount: st.setCount,
          totalVolumeKg: vol,
          sampleCount: se.sampleCount,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: exerciseStats.exerciseId,
          set: {
            baselineExerciseStrengthScore: b.baselineExerciseStrengthScore,
            baselineSetE1rm: b.baselineSetE1rm,
            bestSetE1rm: st.bestE1rm,
            bestExerciseStrengthScore: se.bestStrength,
            totalSetCount: st.setCount,
            totalVolumeKg: vol,
            sampleCount: se.sampleCount,
            updatedAt: now,
          },
        });
    }
  }
  async upsertStat(workoutSessionId: string): Promise<void> {
    const now = new Date();

    await db.transaction(async (tx) => {
      const [sess] = await tx
        .select({ status: workoutSessions.status })
        .from(workoutSessions)
        .where(eq(workoutSessions.id, workoutSessionId))
        .limit(1);

      if (!sess || sess.status !== "completed") return;

      const seAgg = await tx
        .select({
          exerciseId: sessionExercises.exerciseId,
          sampleCount: sql<number>`count(*)`,
          bestStrength: sql<
            number | null
          >`max(${sessionExercises.strengthScore})`,
        })
        .from(sessionExercises)
        .where(
          and(
            eq(sessionExercises.workoutSessionId, workoutSessionId),
            isNotNull(sessionExercises.exerciseId)
          )
        )
        .groupBy(sessionExercises.exerciseId);

      const setAgg = await tx
        .select({
          exerciseId: sessionExercises.exerciseId,
          setCount: sql<number>`count(*)`,
          bestE1rm: sql<number | null>`max(${sessionSets.e1rm})`,
        })
        .from(sessionSets)
        .innerJoin(
          sessionExercises,
          eq(sessionExercises.id, sessionSets.sessionExerciseId)
        )
        .where(
          and(
            eq(sessionExercises.workoutSessionId, workoutSessionId),
            isNotNull(sessionExercises.exerciseId),
            eq(sessionSets.isCompleted, true),
            eq(sessionSets.isWarmup, false)
          )
        )
        .groupBy(sessionExercises.exerciseId);

      const volAgg = await tx
        .select({
          exerciseId: sessionExercises.exerciseId,
          vol: sql<number>`coalesce(sum(
          (case
            when ${sessionSets.loadUnit} = 'kg'
              then cast(${sessionSets.loadValue} as real)
            else cast(${sessionSets.loadValue} as real) * ${LB_TO_KG}
          end) * ${sessionSets.quantity}
        ), 0)`,
        })
        .from(sessionSets)
        .innerJoin(
          sessionExercises,
          eq(sessionExercises.id, sessionSets.sessionExerciseId)
        )
        .where(
          and(
            eq(sessionExercises.workoutSessionId, workoutSessionId),
            isNotNull(sessionExercises.exerciseId),
            eq(sessionSets.isCompleted, true),
            eq(sessionSets.isWarmup, false),
            sql`${sessionSets.quantity} > 0`,
            isNotNull(sessionSets.loadValue),
            sql`trim(${sessionSets.loadValue}) <> ''`,
            sql`cast(${sessionSets.loadValue} as real) > 0`,
            or(eq(sessionSets.loadUnit, "kg"), eq(sessionSets.loadUnit, "lb"))
          )
        )
        .groupBy(sessionExercises.exerciseId);

      const ids = new Set<string>();
      for (const r of seAgg) ids.add(r.exerciseId!);
      for (const r of setAgg) ids.add(r.exerciseId!);
      for (const r of volAgg) ids.add(r.exerciseId!);

      const seById = new Map(
        seAgg.map((r) => [
          r.exerciseId!,
          { sampleCount: r.sampleCount, bestStrength: r.bestStrength ?? null },
        ])
      );
      const setById = new Map(
        setAgg.map((r) => [
          r.exerciseId!,
          { setCount: r.setCount, bestE1rm: r.bestE1rm ?? null },
        ])
      );
      const volById = new Map(volAgg.map((r) => [r.exerciseId!, r.vol]));

      for (const exerciseId of ids) {
        const se = seById.get(exerciseId) ?? {
          sampleCount: 0,
          bestStrength: null,
        };
        const st = setById.get(exerciseId) ?? { setCount: 0, bestE1rm: null };
        const vol = volById.get(exerciseId) ?? 0;

        const bestE1rmExpr = sql<number | null>`case
        when ${st.bestE1rm} is null then ${exerciseStats.bestSetE1rm}
        when ${exerciseStats.bestSetE1rm} is null then ${st.bestE1rm}
        else max(${exerciseStats.bestSetE1rm}, ${st.bestE1rm})
      end`;

        const bestStrengthExpr = sql<number | null>`case
        when ${se.bestStrength} is null then ${exerciseStats.bestExerciseStrengthScore}
        when ${exerciseStats.bestExerciseStrengthScore} is null then ${se.bestStrength}
        else max(${exerciseStats.bestExerciseStrengthScore}, ${se.bestStrength})
      end`;

        await tx
          .insert(exerciseStats)
          .values({
            exerciseId,
            bestSetE1rm: st.bestE1rm,
            bestExerciseStrengthScore: se.bestStrength,
            totalSetCount: st.setCount,
            totalVolumeKg: vol,
            sampleCount: se.sampleCount,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: exerciseStats.exerciseId,
            set: {
              totalSetCount: sql`${exerciseStats.totalSetCount} + ${st.setCount}`,
              totalVolumeKg: sql`${exerciseStats.totalVolumeKg} + ${vol}`,
              sampleCount: sql`${exerciseStats.sampleCount} + ${se.sampleCount}`,
              bestSetE1rm: bestE1rmExpr,
              bestExerciseStrengthScore: bestStrengthExpr,
              updatedAt: now,
            },
          });
      }
    });
  }
}

export const exerciseStatRepository = new ExerciseStatRepository();
