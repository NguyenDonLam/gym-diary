// src/features/program-period-stats/data/program-period-stat-repository.ts

import type { ProgramPeriodStat } from "../domain/types";

import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { BaseRepository } from "@/src/lib/base-repository";
import { programPeriodStats, sessionExercises, sessionSets, workoutSessions } from "@/db/schema";

import type { ProgramPeriodStatRow } from "./types";
import { ProgramPeriodStatFactory } from "../domain/factory";
import { PeriodType } from "@/db/enums";

const LB_TO_KG = 0.45359237;

export class ProgramPeriodStatRepository extends BaseRepository<ProgramPeriodStat> {
  async get(id: string): Promise<ProgramPeriodStat | null> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats)
      .where(eq(programPeriodStats.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ProgramPeriodStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ProgramPeriodStat[]> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats);
    return rows.map((r) => ProgramPeriodStatFactory.domainFromDb(r));
  }

  async getAllForProgram(programId: string): Promise<ProgramPeriodStat[]> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats)
      .where(eq(programPeriodStats.programId, programId));

    return rows.map((r) => ProgramPeriodStatFactory.domainFromDb(r));
  }

  async getOneForProgramPeriod(
    programId: string,
    periodType: ProgramPeriodStat["periodType"],
    periodStart: Date
  ): Promise<ProgramPeriodStat | null> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats)
      .where(
        and(
          eq(programPeriodStats.programId, programId),
          eq(programPeriodStats.periodType, periodType),
          eq(programPeriodStats.periodStart, periodStart)
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ProgramPeriodStatFactory.domainFromDb(row);
  }

  protected async insert(
    entity: ProgramPeriodStat
  ): Promise<ProgramPeriodStat> {
    const row = ProgramPeriodStatFactory.dbFromDomain(entity);
    await db.insert(programPeriodStats).values(row);
    return entity;
  }

  protected async update(
    entity: ProgramPeriodStat
  ): Promise<ProgramPeriodStat> {
    const row = ProgramPeriodStatFactory.dbFromDomain(entity);

    await db
      .update(programPeriodStats)
      .set(row)
      .where(eq(programPeriodStats.id, entity.id));

    return entity;
  }

  async delete(id: string): Promise<void> {
    await db.delete(programPeriodStats).where(eq(programPeriodStats.id, id));
  }

  async save(entity: ProgramPeriodStat): Promise<ProgramPeriodStat> {
    const existing = await this.get(entity.id);
    if (existing) return this.update(entity);
    return this.insert(entity);
  }

  async upsertPeriodStat(
    workoutSessionId: string,
    periodType: PeriodType
  ): Promise<void> {
    const now = new Date();

    await db.transaction(async (tx) => {
      const [sess] = await tx
        .select({
          programId: workoutSessions.sourceProgramId,
          status: workoutSessions.status,
          startedAt: workoutSessions.startedAt,
        })
        .from(workoutSessions)
        .where(eq(workoutSessions.id, workoutSessionId))
        .limit(1);

      if (!sess?.programId || sess.status !== "completed") return;

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

      // All sessions within the time bin
      const sessions = await tx
        .select({
          startedAt: workoutSessions.startedAt,
          endedAt: workoutSessions.endedAt,
          strengthScore: workoutSessions.strengthScore,
        })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.status, "completed"),
            eq(workoutSessions.sourceProgramId, sess.programId),
            isNotNull(workoutSessions.startedAt),
            sql`${workoutSessions.startedAt} >= ${startIso}`,
            sql`${workoutSessions.startedAt} < ${endIso}`
          )
        )
        .orderBy(asc(workoutSessions.startedAt));

      let sessionCount = 0;
      let durationSec = 0;

      for (const s of sessions) {
        if (!s.endedAt) continue;
        const sec = Math.floor(
          (+new Date(s.endedAt) - +new Date(s.startedAt)) / 1000
        );
        if (sec <= 0) continue;
        sessionCount += 1;
        durationSec += sec;
      }

      const sets = await tx
        .select({
          quantity: sessionSets.quantity,
          loadUnit: sessionSets.loadUnit,
          loadValue: sessionSets.loadValue,
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
            eq(workoutSessions.sourceProgramId, sess.programId),
            isNotNull(workoutSessions.startedAt),
            sql`${workoutSessions.startedAt} >= ${startIso}`,
            sql`${workoutSessions.startedAt} < ${endIso}`,
            eq(sessionSets.isCompleted, true),
            eq(sessionSets.isWarmup, false)
          )
        );

      let volumeKg = 0;

      for (const r of sets) {
        const reps = r.quantity ?? null;
        if (reps == null || !Number.isFinite(reps) || reps <= 0) continue;

        const raw = Number.parseFloat((r.loadValue ?? "").trim());
        if (!Number.isFinite(raw) || raw <= 0) continue;

        const loadKg =
          r.loadUnit === "kg"
            ? raw
            : r.loadUnit === "lb"
              ? raw * LB_TO_KG
              : null;

        if (loadKg == null || !Number.isFinite(loadKg) || loadKg <= 0) continue;

        volumeKg += loadKg * reps;
      }

      const [prev] = await tx
        .select({ score: workoutSessions.strengthScore })
        .from(workoutSessions)
        .where(
          and(
            eq(workoutSessions.status, "completed"),
            eq(workoutSessions.sourceProgramId, sess.programId),
            isNotNull(workoutSessions.startedAt),
            isNotNull(workoutSessions.strengthScore),
            sql`${workoutSessions.startedAt} < ${startIso}`
          )
        )
        .orderBy(desc(workoutSessions.startedAt))
        .limit(1);

      let prevScore =
        typeof prev?.score === "number" &&
        Number.isFinite(prev.score) &&
        prev.score > 0
          ? prev.score
          : null;

      let sum = 0;
      let n = 0;

      for (const s of sessions) {
        const score =
          typeof s.strengthScore === "number" &&
          Number.isFinite(s.strengthScore) &&
          s.strengthScore > 0
            ? s.strengthScore
            : null;

        if (score == null) continue;

        if (prevScore != null && prevScore > 0) {
          const p = (score - prevScore) / prevScore;
          if (Number.isFinite(p)) {
            sum += p;
            n += 1;
          }
        }

        prevScore = score;
      }

      const averageProgression = n ? sum / n : 0;

      const id = `${sess.programId}:${periodType}:${+start}`;

      await tx
        .insert(programPeriodStats)
        .values({
          id,
          programId: sess.programId,
          periodType,
          periodStart: start,
          sessionCount,
          volumeKg,
          durationSec,
          averageProgression,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: programPeriodStats.id,
          set: {
            sessionCount,
            volumeKg,
            durationSec,
            averageProgression,
            updatedAt: now,
          },
        });
    });
  }
}

export const programPeriodStatRepository = new ProgramPeriodStatRepository();
