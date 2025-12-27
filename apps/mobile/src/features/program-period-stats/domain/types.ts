import type { WorkoutProgram } from "../../program-workout/domain/type";
import type { PeriodType } from "@/db/enums";

export type ProgramPeriodStat = {
  id: string;

  programId: string;

  periodType: PeriodType;
  periodStart: Date;

  sessionCount: number;
  volumeKg: number;
  durationSec: number;
  averageProgression: number;

  updatedAt: Date;

  // relations
  program?: WorkoutProgram;
};
