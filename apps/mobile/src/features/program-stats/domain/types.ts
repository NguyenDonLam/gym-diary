import type { WorkoutProgram } from "@/src/features/program-workout/domain/type";

export type ProgramStat = {
  // FK (1:1 cache row per program)
  programId: string;

  // Lifetime aggregates
  totalSessionCount: number;
  totalSetCount: number;
  totalRepCount: number;
  totalVolumeKg: number;
  totalDurationSec: number;

  // Robust central tendency for progression (nullable until enough history)
  medianProgression: number | null;

  // Last time this cache row was recomputed
  updatedAt: Date;

  // relations
  program?: WorkoutProgram;
};
