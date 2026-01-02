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

  async updateProgramStat(workoutSessionId: string): Promise<void> {
    await programStatRepository.upsertStat(workoutSessionId);

    const periodTypes: PeriodType[] = ["week", "month", "year"];

    for (const periodType of periodTypes) {
      await programPeriodStatRepository.upsertPeriodStat(
        workoutSessionId,
        periodType
      );
    }
  }

  async updateExerciseStat(workoutSessionId: string): Promise<void> {
    await exerciseStatRepository.upsertStat(workoutSessionId);

    const periodTypes: PeriodType[] = ["week", "month", "year"];

    for (const periodType of periodTypes) {
      await exercisePeriodStatRepository.upsertPeriodStat(
        workoutSessionId,
        periodType
      );
    }
  }
}

export const statService = new StatService();
