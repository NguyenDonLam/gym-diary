// src/features/session-exercise/data/row-factory.ts

import { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionSet } from "@/src/features/session-set/domain/types";
import { TemplateExercise } from "@/src/features/template-exercise/domain/type";
import { SessionExerciseRow } from "./types";

/**
 * Factory responsible ONLY for mapping between:
 *   - DB row shape (SessionExerciseRow)
 *   - Domain aggregate (SessionExercise)
 *
 * It does not know about forms or UI.
 */
export class SessionExerciseRowFactory {
  /**
   * DB row + already-loaded sets (+ optional templateExercise)
   * -> domain aggregate.
   *
   * Sets should be mapped by their own factories and passed in here
   * as domain objects.
   */
  static toDomain(
    row: SessionExerciseRow,
    sets: SessionSet[] = [],
    templateExercise?: TemplateExercise
  ): SessionExercise {
    return {
      id: row.id,

      workoutSessionId: row.workoutSessionId,

      exerciseId: row.exerciseId,
      templateExerciseId: row.templateExerciseId,
      templateExercise,

      exerciseName: row.exerciseName,

      orderIndex: row.orderIndex,

      note: row.note,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),

      sets,
    };
  }

  /**
   * Domain aggregate -> DB row for the session_exercises table.
   *
   * Sets are NOT handled here; they should be persisted via
   * their own row factories / DAOs.
   */
  static fromDomain(domain: SessionExercise): SessionExerciseRow {
    return {
      id: domain.id,

      workoutSessionId: domain.workoutSessionId,

      exerciseId: domain.exerciseId,
      templateExerciseId: domain.templateExerciseId,

      exerciseName: domain.exerciseName,

      orderIndex: domain.orderIndex,

      note: domain.note,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  static toRow(domain: SessionExercise): SessionExerciseRow {
    return this.fromDomain(domain);
  }

  static fromRow(
    row: SessionExerciseRow,
    sets: SessionSet[] = [],
    templateExercise?: TemplateExercise
  ): SessionExercise {
    return this.toDomain(row, sets, templateExercise);
  }
}
