// src/features/session-workout/data/row-factory.ts

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { workoutSessions } from "@/db/schema";

import type { TemplateWorkout } from "@/src/features/template-workout/domain/type";
import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionWorkout } from "../domain/types";
import { SessionWorkoutRow } from "./types";

/**
 * Factory responsible ONLY for mapping between:
 *   - DB row shape (SessionWorkoutRow)
 *   - Domain aggregate (SessionWorkout)
 *
 * It does not know about forms or UI.
 */
export class SessionWorkoutRowFactory {
  /**
   * DB row + already-loaded relations -> domain aggregate.
   *
   * Related entities should be mapped by their own factories and
   * passed in here as domain objects.
   */
  static toDomain(
    row: SessionWorkoutRow,
    exercises: SessionExercise[] = [],
    sourceTemplate?: TemplateWorkout
  ): SessionWorkout {
    return {
      id: row.id,

      startedAt: new Date(row.startedAt),
      endedAt: row.endedAt ? new Date(row.endedAt) : null,

      sourceTemplateId: row.sourceTemplateId,
      sourceTemplate,

      note: row.note,

      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),

      exercises,
    };
  }

  /**
   * Domain aggregate -> DB row for the workout_sessions table.
   *
   * Exercises / template are NOT handled here; they should be
   * persisted via their own factories / repositories.
   */
  static fromDomain(domain: SessionWorkout): SessionWorkoutRow {
    return {
      id: domain.id,

      startedAt: domain.startedAt.toISOString(),
      endedAt: domain.endedAt ? domain.endedAt.toISOString() : null,

      sourceTemplateId: domain.sourceTemplateId,

      note: domain.note,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  static toRow(domain: SessionWorkout): SessionWorkoutRow {
    return this.fromDomain(domain);
  }

  static fromRow(
    row: SessionWorkoutRow,
    exercises: SessionExercise[] = [],
    sourceTemplate?: TemplateWorkout
  ): SessionWorkout {
    return this.toDomain(row, exercises, sourceTemplate);
  }
}
