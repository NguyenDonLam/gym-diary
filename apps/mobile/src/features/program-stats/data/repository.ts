// src/features/program-stats/data/program-stat-repository.ts

import type { ProgramStat } from "../domain/types";

import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { BaseRepository } from "@/src/lib/base-repository";
import {
  programStats,
  workoutPrograms,
  workoutSessions,
  sessionExercises,
  sessionSets,
} from "@/db/schema";

import type { ProgramStatRow } from "./types";
import { ProgramStatFactory } from "../domain/factory";

const LB_TO_KG = 0.45359237;

export class ProgramStatRepository extends BaseRepository<ProgramStat> {
  async get(programId: string): Promise<ProgramStat | null> {
    const rows: ProgramStatRow[] = await db
      .select()
      .from(programStats)
      .where(eq(programStats.programId, programId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ProgramStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ProgramStat[]> {
    const rows: ProgramStatRow[] = await db.select().from(programStats);
    return rows.map((r) => ProgramStatFactory.domainFromDb(r));
  }

  protected async insert(entity: ProgramStat): Promise<ProgramStat> {
    const row = ProgramStatFactory.dbFromDomain(entity);
    await db.insert(programStats).values(row);
    return entity;
  }

  protected async update(entity: ProgramStat): Promise<ProgramStat> {
    const row = ProgramStatFactory.dbFromDomain(entity);

    await db
      .update(programStats)
      .set(row)
      .where(eq(programStats.programId, entity.programId));

    return entity;
  }

  async delete(programId: string): Promise<void> {
    await db.delete(programStats).where(eq(programStats.programId, programId));
  }

  async save(entity: ProgramStat): Promise<ProgramStat> {
    const existing = await this.get(entity.programId);
    if (existing) return this.update(entity);
    return this.insert(entity);
  }

  /**
   * Maintenance-only: recompute lifetime stats for ALL programs.
   * Creates/updates a `program_stats` row for every program, including programs with zero sessions.
   *
   * Policy:
   * - sessions counted only when status="completed" AND endedAt is present AND duration > 0
   * - sets counted only when isCompleted=true AND isWarmup=false
   * - reps counted only when quantity is positive
   * - volume counted only when load is numeric and unit is kg/lb
   * - medianProgression preserved from existing rows (not recomputed here)
   */
  async computeLifetimeStat(): Promise<void> {
    const now = new Date();

    const programs = await db
      .select({ id: workoutPrograms.id })
      .from(workoutPrograms);

    const existing = await db
      .select({
        programId: programStats.programId,
        medianProgression: programStats.medianProgression,
      })
      .from(programStats);

    const medianByProgramId = new Map<string, number | null>(
      existing.map((r) => [r.programId, r.medianProgression ?? null])
    );

    const accumulator: Record<
      string,
      {
        s: number;
        dur: number;
        set: number;
        rep: number;
        vol: number;
      }
    > = {};

    for (const p of programs)
      accumulator[p.id] = { s: 0, dur: 0, set: 0, rep: 0, vol: 0 };

    const sessions = await db
      .select({
        programId: workoutSessions.sourceProgramId,
        startedAt: workoutSessions.startedAt,
        endedAt: workoutSessions.endedAt,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.status, "completed"),
          isNotNull(workoutSessions.sourceProgramId)
        )
      );

    for (const s of sessions) {
      const pid = s.programId;
      if (!pid) continue;
      const a = accumulator[pid];
      if (!a) continue;

      if (!s.endedAt) continue;
      const t0 = new Date(s.startedAt).getTime();
      const t1 = new Date(s.endedAt).getTime();
      if (!Number.isFinite(t0) || !Number.isFinite(t1)) continue;

      const sec = Math.floor((t1 - t0) / 1000);
      if (sec <= 0) continue;

      a.s += 1;
      a.dur += sec;
    }

    const sets = await db
      .select({
        programId: workoutSessions.sourceProgramId,
        isCompleted: sessionSets.isCompleted,
        isWarmup: sessionSets.isWarmup,
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
          isNotNull(workoutSessions.sourceProgramId)
        )
      );

    for (const r of sets) {
      const pid = r.programId;
      if (!pid) continue;
      const a = accumulator[pid];
      if (!a) continue;

      if (!r.isCompleted) continue;
      if (r.isWarmup) continue;

      a.set += 1;

      const reps = r.quantity ?? null;
      if (reps == null || !Number.isFinite(reps) || reps <= 0) continue;
      a.rep += reps;

      const rawStr = (r.loadValue ?? "").trim();
      if (!rawStr) continue;

      const raw = Number.parseFloat(rawStr);
      if (!Number.isFinite(raw) || raw <= 0) continue;

      const loadKg =
        r.loadUnit === "kg" ? raw : r.loadUnit === "lb" ? raw * LB_TO_KG : null;

      if (loadKg == null || !Number.isFinite(loadKg) || loadKg <= 0) continue;
      a.vol += loadKg * reps;
    }

    for (const p of programs) {
      const a = accumulator[p.id] ?? { s: 0, dur: 0, set: 0, rep: 0, vol: 0 };

      await db
        .insert(programStats)
        .values({
          programId: p.id,
          totalSessionCount: a.s,
          totalSetCount: a.set,
          totalRepCount: a.rep,
          totalVolumeKg: a.vol,
          totalDurationSec: a.dur,
          medianProgression: medianByProgramId.get(p.id) ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: programStats.programId,
          set: {
            totalSessionCount: a.s,
            totalSetCount: a.set,
            totalRepCount: a.rep,
            totalVolumeKg: a.vol,
            totalDurationSec: a.dur,
            medianProgression: medianByProgramId.get(p.id) ?? null,
            updatedAt: now,
          },
        });
    }
  }

  async upsertStat(workoutSessionId: string): Promise<void> {
    const now = new Date();

    await db.transaction(async (tx) => {
      const [sess] = await tx
        .select({
          programId: workoutSessions.sourceProgramId,
          status: workoutSessions.status,
          startedAt: workoutSessions.startedAt,
          endedAt: workoutSessions.endedAt,
        })
        .from(workoutSessions)
        .where(eq(workoutSessions.id, workoutSessionId))
        .limit(1);

      if (!sess?.programId) return;
      if (sess.status !== "completed") return;
      if (!sess.endedAt) return;

      const durationSecDelta = Math.floor(
        (+new Date(sess.endedAt) - +new Date(sess.startedAt)) / 1000
      );
      if (!(durationSecDelta > 0)) return;

      const deltas = (
        await tx
          .select({
            isCompleted: sessionSets.isCompleted,
            isWarmup: sessionSets.isWarmup,
            quantity: sessionSets.quantity,
            loadUnit: sessionSets.loadUnit,
            loadValue: sessionSets.loadValue,
          })
          .from(sessionSets)
          .innerJoin(
            sessionExercises,
            eq(sessionExercises.id, sessionSets.sessionExerciseId)
          )
          .where(eq(sessionExercises.workoutSessionId, workoutSessionId))
      ).reduce(
        (a, r) => {
          if (!r.isCompleted || r.isWarmup) return a;

          a.set += 1;

          const reps = r.quantity ?? null;
          if (reps == null || !Number.isFinite(reps) || reps <= 0) return a;
          a.rep += reps;

          const rawStr = (r.loadValue ?? "").trim();
          if (!rawStr) return a;

          const raw = Number.parseFloat(rawStr);
          if (!Number.isFinite(raw) || raw <= 0) return a;

          const loadKg =
            r.loadUnit === "kg"
              ? raw
              : r.loadUnit === "lb"
                ? raw * LB_TO_KG
                : null;

          if (loadKg == null || !Number.isFinite(loadKg) || loadKg <= 0)
            return a;

          a.vol += loadKg * reps;
          return a;
        },
        { set: 0, rep: 0, vol: 0 }
      );

      const [cur] = await tx
        .select()
        .from(programStats)
        .where(eq(programStats.programId, sess.programId))
        .limit(1);

      const next = {
        totalSessionCount: (cur?.totalSessionCount ?? 0) + 1,
        totalSetCount: (cur?.totalSetCount ?? 0) + deltas.set,
        totalRepCount: (cur?.totalRepCount ?? 0) + deltas.rep,
        totalVolumeKg: (cur?.totalVolumeKg ?? 0) + deltas.vol,
        totalDurationSec: (cur?.totalDurationSec ?? 0) + durationSecDelta,
        medianProgression: cur?.medianProgression ?? null,
        updatedAt: now,
      };

      await tx
        .insert(programStats)
        .values({ programId: sess.programId, ...next })
        .onConflictDoUpdate({
          target: programStats.programId,
          set: next,
        });
    });
  }
}

export const programStatRepository = new ProgramStatRepository();
