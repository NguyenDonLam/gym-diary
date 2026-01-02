// src/features/exercise-period-stats/data/exercise-period-stat-repository.ts

import type { ExercisePeriodStat } from "../domain/types";

import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exercisePeriodStats, sessionExercises, sessionSets, workoutSessions } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";

import type { ExercisePeriodStatRow } from "./types";
import { ExercisePeriodStatFactory } from "../domain/factory";
import { PeriodType } from "@/db/enums";

const LB_TO_KG = 0.45359237;

export class ExercisePeriodStatRepository extends BaseRepository<ExercisePeriodStat> {
  async get(id: string): Promise<ExercisePeriodStat | null> {
    const rows: ExercisePeriodStatRow[] = await db
      .select()
      .from(exercisePeriodStats)
      .where(eq(exercisePeriodStats.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ExercisePeriodStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ExercisePeriodStat[]> {
    const rows: ExercisePeriodStatRow[] = await db
      .select()
      .from(exercisePeriodStats);

    return rows.map((r) => ExercisePeriodStatFactory.domainFromDb(r));
  }

  protected async insert(
    entity: ExercisePeriodStat & { id?: string | null }
  ): Promise<ExercisePeriodStat> {
    const id = entity.id ?? generateId();
    const withId: ExercisePeriodStat = {
      ...(entity as ExercisePeriodStat),
      id,
    };

    const row = ExercisePeriodStatFactory.dbFromDomain(withId);

    await db.insert(exercisePeriodStats).values(row);

    return withId;
  }

  protected async update(
    entity: ExercisePeriodStat & { id?: string | null }
  ): Promise<ExercisePeriodStat> {
    if (!entity.id)
      throw new Error("Cannot update ExercisePeriodStat without id");

    const row = ExercisePeriodStatFactory.dbFromDomain(
      entity as ExercisePeriodStat
    );

    await db
      .update(exercisePeriodStats)
      .set(row)
      .where(eq(exercisePeriodStats.id, entity.id));

    return entity as ExercisePeriodStat;
  }

  async delete(id: string): Promise<void> {
    await db.delete(exercisePeriodStats).where(eq(exercisePeriodStats.id, id));
  }

  async upsertPeriodStat(
    workoutSessionId: string,
    periodType: PeriodType
  ): Promise<void> {
    const now = new Date();

    await db.transaction(async (tx) => {
      const [sess] = await tx
        .select({
          status: workoutSessions.status,
          startedAt: workoutSessions.startedAt,
        })
        .from(workoutSessions)
        .where(eq(workoutSessions.id, workoutSessionId))
        .limit(1);

      if (!sess || sess.status !== "completed") return;

      const d = new Date(sess.startedAt);

      let start: Date;
      let endExclusive: Date;

      if (periodType === "year") {
        start = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
        endExclusive = new Date(d.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      } else if (periodType === "month") {
        start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        endExclusive = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          1,
          0,
          0,
          0,
          0
        );
      } else {
        const diffToMon = (d.getDay() + 6) % 7;
        start = new Date(d);
        start.setDate(d.getDate() - diffToMon);
        start.setHours(0, 0, 0, 0);
        endExclusive = new Date(start);
        endExclusive.setDate(start.getDate() + 7);
      }

      const startIso = start.toISOString();
      const endIso = endExclusive.toISOString();

      const exInSession = await tx
        .select({ exerciseId: sessionExercises.exerciseId })
        .from(sessionExercises)
        .where(
          and(
            eq(sessionExercises.workoutSessionId, workoutSessionId),
            isNotNull(sessionExercises.exerciseId)
          )
        );

      const exerciseIds = Array.from(
        new Set(exInSession.map((r) => r.exerciseId!).filter(Boolean))
      );
      if (!exerciseIds.length) return;

      const seAgg = await tx
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
            inArray(sessionExercises.exerciseId, exerciseIds),
            sql`${workoutSessions.startedAt} >= ${startIso}`,
            sql`${workoutSessions.startedAt} < ${endIso}`
          )
        )
        .groupBy(sessionExercises.exerciseId);

      const loadKgExpr = sql<number | null>`case
      when ${sessionSets.loadUnit} = 'kg' then cast(${sessionSets.loadValue} as real)
      when ${sessionSets.loadUnit} = 'lb' then cast(${sessionSets.loadValue} as real) * ${LB_TO_KG}
      else null
    end`;

      const setAgg = await tx
        .select({
          exerciseId: sessionExercises.exerciseId,
          setCount: sql<number>`count(*)`,
          bestE1rm: sql<number | null>`max(${sessionSets.e1rm})`,
          volumeKg: sql<number>`coalesce(sum(${loadKgExpr} * ${sessionSets.quantity}), 0)`,
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
            inArray(sessionExercises.exerciseId, exerciseIds),
            sql`${workoutSessions.startedAt} >= ${startIso}`,
            sql`${workoutSessions.startedAt} < ${endIso}`,
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

      const seById = new Map(
        seAgg.map((r) => [
          r.exerciseId!,
          { sampleCount: r.sampleCount, bestStrength: r.bestStrength ?? null },
        ])
      );

      const setById = new Map(
        setAgg.map((r) => [
          r.exerciseId!,
          {
            setCount: r.setCount,
            bestE1rm: r.bestE1rm ?? null,
            volumeKg: r.volumeKg ?? 0,
          },
        ])
      );

      const existing = await tx
        .select({
          id: exercisePeriodStats.id,
          exerciseId: exercisePeriodStats.exerciseId,
        })
        .from(exercisePeriodStats)
        .where(
          and(
            inArray(exercisePeriodStats.exerciseId, exerciseIds),
            eq(exercisePeriodStats.periodType, periodType),
            eq(exercisePeriodStats.periodStart, start)
          )
        );

      const idByExerciseId = new Map(existing.map((r) => [r.exerciseId, r.id]));

      for (const exerciseId of exerciseIds) {
        const se = seById.get(exerciseId) ?? {
          sampleCount: 0,
          bestStrength: null,
        };
        const st = setById.get(exerciseId) ?? {
          setCount: 0,
          bestE1rm: null,
          volumeKg: 0,
        };

        const payload = {
          exerciseId,
          periodType,
          periodStart: start,

          // adjust field names here if your table uses different ones
          totalSetCount: st.setCount,
          totalVolumeKg: st.volumeKg,
          bestSetE1rm: st.bestE1rm,
          bestExerciseStrengthScore: se.bestStrength,
          sampleCount: se.sampleCount,

          updatedAt: now,
        };

        const id = idByExerciseId.get(exerciseId);
        if (id) {
          await tx
            .update(exercisePeriodStats)
            .set(payload)
            .where(eq(exercisePeriodStats.id, id));
        } else {
          await tx
            .insert(exercisePeriodStats)
            .values({ id: generateId(), ...payload });
        }
      }
    });
  }
}

export const exercisePeriodStatRepository = new ExercisePeriodStatRepository();
