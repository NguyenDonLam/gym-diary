// src/features/exercise-stat/domain/factory.ts

import type { InferInsertModel } from "drizzle-orm";
import { exerciseStats } from "@/db/schema";

import type { ExerciseStat } from "../domain/types";
import type { ExerciseStatRow } from "../data/types";
import { exerciseFactory } from "../../exercise/domain/factory";

type ExerciseStatInsert = InferInsertModel<typeof exerciseStats>;

export class ExerciseStatFactory {
  static domainFromDb(row: ExerciseStatRow): ExerciseStat {
    const updatedAt =
      row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);

    return {
      exerciseId: row.exerciseId,

      baselineExerciseStrengthScore: row.baselineExerciseStrengthScore ?? null,
      baselineSetE1rm: row.baselineSetE1rm ?? null,

      bestSetE1rm: row.bestSetE1rm ?? null,
      bestExerciseStrengthScore: row.bestExerciseStrengthScore ?? null,
      totalSetCount: row.totalSetCount,
      totalVolumeKg: row.totalVolumeKg,

      sampleCount: row.sampleCount,

      updatedAt,

      exercise: row.exercise
        ? exerciseFactory.domainFromDb(row.exercise)
        : undefined,
    };
  }

  static dbFromDomain(entity: ExerciseStat): ExerciseStatInsert {
    return {
      exerciseId: entity.exerciseId,

      baselineExerciseStrengthScore:
        entity.baselineExerciseStrengthScore ?? null,
      baselineSetE1rm: entity.baselineSetE1rm ?? null,

      bestSetE1rm: entity.bestSetE1rm ?? null,
      bestExerciseStrengthScore: entity.bestExerciseStrengthScore ?? null,
      totalSetCount: entity.totalSetCount,
      totalVolumeKg: entity.totalVolumeKg,

      sampleCount: entity.sampleCount,

      updatedAt: entity.updatedAt,
    };
  }

  static create(
    overrides: Partial<ExerciseStat> & { exerciseId: string }
  ): ExerciseStat {
    const now = new Date();

    return {

      baselineExerciseStrengthScore: null,
      baselineSetE1rm: null,

      bestSetE1rm: null,
      bestExerciseStrengthScore: null,
      totalSetCount: 0,
      totalVolumeKg: 0,

      sampleCount: 0,

      updatedAt: now,

      exercise: undefined,

      ...overrides,
    };
  }
}
