import type { ExercisePeriodStat } from "../domain/types";
import { ExercisePeriodStatRow } from "../data/types";
import { exerciseFactory } from "../../exercise/domain/factory";

export class ExercisePeriodStatFactory {
  static domainFromDb(row: ExercisePeriodStatRow): ExercisePeriodStat {
    return {
      id: row.id,
      exerciseId: row.exerciseId,
      periodType: row.periodType,
      periodStart: row.periodStart,
      sessionCount: row.sessionCount,

      bestStrengthScore: row.bestStrengthScore,
      medianStrengthScore: row.medianStrengthScore,

      bestSetE1rm: row.bestSetE1rm,
      medianSetE1rm: row.medianSetE1rm,

      updatedAt: row.updatedAt,
      exercise: row.exercise ? exerciseFactory.domainFromDb(row.exercise) : undefined,
    };
  }

  static dbFromDomain(entity: ExercisePeriodStat): ExercisePeriodStatRow {
    return {
      id: entity.id,
      exerciseId: entity.exerciseId,
      periodType: entity.periodType,
      periodStart: entity.periodStart,
      sessionCount: entity.sessionCount,

      bestStrengthScore: entity.bestStrengthScore,
      medianStrengthScore: entity.medianStrengthScore,

      bestSetE1rm: entity.bestSetE1rm,
      medianSetE1rm: entity.medianSetE1rm,

      updatedAt: entity.updatedAt,
    };
  }
}
