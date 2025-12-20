// src/features/exercise-stat/domain/factory.ts
import type { InferInsertModel } from "drizzle-orm";
import { exerciseStats } from "@/db/schema";

import type { ExerciseStat } from "../domain/types";
import type { ExerciseStatRow } from "../data/types";
import { exerciseFactory } from "../../exercise/domain/factory";

type ExerciseStatInsert = InferInsertModel<typeof exerciseStats>;

export class ExerciseStatFactory {
  static domainFromDb(row: ExerciseStatRow): ExerciseStat {
    return {
      exerciseId: row.exerciseId,

      baselineExerciseStrengthScore: row.baselineExerciseStrengthScore,
      baselineSetE1rm: row.baselineSetE1rm,

      sampleCount: row.sampleCount,

      updatedAt: row.updatedAt,
      exercise: row.exercise
        ? exerciseFactory.domainFromDb(row.exercise)
        : undefined,
    };
  }

  static dbFromDomain(entity: ExerciseStat): ExerciseStatInsert {
    return {
      exerciseId: entity.exerciseId,

      baselineExerciseStrengthScore: entity.baselineExerciseStrengthScore,
      baselineSetE1rm: entity.baselineSetE1rm,

      sampleCount: entity.sampleCount,

      updatedAt: entity.updatedAt,
    };
  }
}
