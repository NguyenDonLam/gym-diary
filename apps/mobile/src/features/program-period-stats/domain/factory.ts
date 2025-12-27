// src/features/program-period-stats/domain/factory.ts

import type { ProgramPeriodStat } from "@/src/features/program-period-stats/domain/types";
import type { ProgramPeriodStatRow } from "@/src/features/program-period-stats/data/types";
import { generateId } from "@/src/lib/id";
import { WorkoutProgramFactory } from "../../program-workout/domain/factory";

export class ProgramPeriodStatFactory {
  static domainFromDb(row: ProgramPeriodStatRow): ProgramPeriodStat {
    const periodStart =
      row.periodStart instanceof Date
        ? row.periodStart
        : new Date(row.periodStart);

    const updatedAt =
      row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);

    const program = row.program
      ? WorkoutProgramFactory.domainFromDb(row.program)
      : undefined;

    return {
      id: row.id,
      programId: row.programId,
      periodType: row.periodType,
      periodStart,
      sessionCount: row.sessionCount,
      volumeKg: row.volumeKg,
      durationSec: row.durationSec,
      averageProgression: row.averageProgression,
      updatedAt,
      program,
    };
  }

  static dbFromDomain(domain: ProgramPeriodStat): ProgramPeriodStatRow {
    return {
      id: domain.id,

      programId: domain.programId,

      periodType: domain.periodType,
      periodStart: domain.periodStart,

      sessionCount: domain.sessionCount,
      volumeKg: domain.volumeKg,
      durationSec: domain.durationSec,
      averageProgression: domain.averageProgression,

      updatedAt: domain.updatedAt,
    };
  }

  static create(
    overrides: Partial<ProgramPeriodStat> &
      Pick<ProgramPeriodStat, "programId" | "periodType" | "periodStart">
  ): ProgramPeriodStat {
    const now = new Date();

    return {
      id: generateId(),
      sessionCount: 0,
      volumeKg: 0,
      durationSec: 0,
      averageProgression: 0,

      updatedAt: now,

      program: undefined,

      ...overrides,
    };
  }
}
