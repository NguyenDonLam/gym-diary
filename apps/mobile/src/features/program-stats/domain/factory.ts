// src/features/program-stats/domain/factory.ts

import type { ProgramStat } from "@/src/features/program-stats/domain/types";
import type { ProgramStatRow } from "@/src/features/program-stats/data/types";

export class ProgramStatFactory {
  static create(
    overrides: Partial<ProgramStat> & Pick<ProgramStat, "programId">
  ): ProgramStat {
    const now = new Date();

    return {

      totalSessionCount: 0,
      totalSetCount: 0,
      totalRepCount: 0,
      totalVolumeKg: 0,
      totalDurationSec: 0,

      medianProgression: null,

      updatedAt: now,

      program: undefined,

      ...overrides,
    };
  }

  static domainFromDb(row: ProgramStatRow): ProgramStat {
    const updatedAt =
      row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);

    return {
      programId: row.programId,

      totalSessionCount: row.totalSessionCount,
      totalSetCount: row.totalSetCount,
      totalRepCount: row.totalRepCount,
      totalVolumeKg: row.totalVolumeKg,
      totalDurationSec: row.totalDurationSec,

      medianProgression: row.medianProgression ?? null,

      updatedAt,

      program: row.program,
    };
  }

  static dbFromDomain(domain: ProgramStat): ProgramStatRow {
    return {
      programId: domain.programId,

      totalSessionCount: domain.totalSessionCount,
      totalSetCount: domain.totalSetCount,
      totalRepCount: domain.totalRepCount,
      totalVolumeKg: domain.totalVolumeKg,
      totalDurationSec: domain.totalDurationSec,

      medianProgression: domain.medianProgression ?? null,

      updatedAt: domain.updatedAt,
    };
  }
}
