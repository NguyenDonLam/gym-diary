// src/features/stats/stat-service.ts

import type { PeriodType } from "@/db/enums";

import { programStatRepository } from "../../program-stats/data/repository";
import { exerciseStatRepository } from "../../exercise-stats/data/repository";
import { programPeriodStatRepository } from "../../program-period-stats/data/repository";
import { exercisePeriodStatRepository } from "../../exercise-period-stats/data/repository";

/**
 * Repos compute + persist. Service decides buckets.
 *
 * Ghost repo methods you implement (no row returns):
 *
 * programStatRepository:
 * - upsertStat(programId: string): Promise<void>
 * - recomputeLifetimeStat(): Promise<void> // maintenance-only
 *
 * exerciseStatRepository:
 * - upsertStat(exerciseId: string): Promise<void>
 * - computeLifetimeStat(): Promise<void> // maintenance-only
 *
 * programPeriodStatRepository:
 * - upsertPeriodStat(args: {
 *     programId: string;
 *     periodType: PeriodType;
 *     periodStart: Date;
 *     rangeStart: Date;
 *     rangeEndExclusive: Date;
 *   }): Promise<void>
 *
 * exercisePeriodStatRepository:
 * - upsertPeriodStat(args: {
 *     exerciseId: string;
 *     periodType: PeriodType;
 *     periodStart: Date;
 *     rangeStart: Date;
 *     rangeEndExclusive: Date;
 *   }): Promise<void>
 */

export class StatService {
  async rebuildAllLifetimeStats(): Promise<void> {
    await programStatRepository.computeLifetimeStat();
    await exerciseStatRepository.computeLifetimeStat();
  }

  async updateProgramStat(programId: string, at: Date): Promise<void> {
    await programStatRepository.upsertStat(programId);

    const periodTypes: PeriodType[] = ["week", "month", "year"];
    const d = new Date(at);

    for (const periodType of periodTypes) {
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
        const day = d.getDay(); // 0=Sun..6=Sat
        const diffToMon = (day + 6) % 7;

        start = new Date(d);
        start.setDate(d.getDate() - diffToMon);
        start.setHours(0, 0, 0, 0);

        endExclusive = new Date(start);
        endExclusive.setDate(start.getDate() + 7);
      }

      await programPeriodStatRepository.upsertPeriodStat({
        programId,
        periodType,
        periodStart: start,
        rangeStart: start,
        rangeEndExclusive: endExclusive,
      });
    }
  }

  async updateExerciseStat(exerciseId: string, at: Date): Promise<void> {
    await exerciseStatRepository.upsertStat(exerciseId);

    const periodTypes: PeriodType[] = ["week", "month", "year"];
    const d = new Date(at);

    for (const periodType of periodTypes) {
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
        const day = d.getDay(); // 0=Sun..6=Sat
        const diffToMon = (day + 6) % 7;

        start = new Date(d);
        start.setDate(d.getDate() - diffToMon);
        start.setHours(0, 0, 0, 0);

        endExclusive = new Date(start);
        endExclusive.setDate(start.getDate() + 7);
      }

      await exercisePeriodStatRepository.upsertPeriodStat({
        exerciseId,
        periodType,
        periodStart: start,
        rangeStart: start,
        rangeEndExclusive: endExclusive,
      });
    }
  }
}

export const statService = new StatService();
