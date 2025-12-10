// src/features/session-workout/data/row-factory.ts

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { workoutSessions } from "@/db/schema";

import type { WorkoutProgram } from "@/src/features/program-workout/domain/type";
import type { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionWorkout } from "../domain/types";
import { SessionWorkoutRow } from "./types";
import { SessionExerciseRow } from "../../session-exercise/data/types";
import { SessionSetRow } from "../../session-set/data/types";
import { SessionSet } from "../../session-set/domain/types";

type SessionWorkoutQueryResult = SessionWorkoutRow & {
  sessionExercises: (SessionExerciseRow & {
    sessionSets: SessionSetRow[];
  })[];
};
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
  static toDomain(row: SessionWorkoutRow): SessionWorkout {
    return {
      id: row.id,
      startedAt: new Date(row.startedAt),
      endedAt: row.endedAt ? new Date(row.endedAt) : null,
      sourceTemplateId: row.sourceProgramId ?? null,
      sourceTemplate: undefined,
      note: row.note,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      exercises: [],
    };
  }

  // NEW: full tree mapper for relational query
  static fromQuery(result: SessionWorkoutQueryResult): SessionWorkout {
    const exercises: SessionExercise[] = (result.sessionExercises ?? []).map(
      (ex) => {
        const sets: SessionSet[] = (ex.sessionSets ?? []).map((s) => ({
          id: s.id,

          sessionExerciseId: s.sessionExerciseId,
          templateSetId: s.setProgramId,
          templateSet: undefined,

          orderIndex: s.orderIndex,

          reps: s.reps,
          loadUnit: s.loadUnit,
          loadValue: s.loadValue,
          rpe: s.rpe,

          isWarmup: s.isWarmup,

          note: s.note,

          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));

        const sessionExercise: SessionExercise = {
          id: ex.id,

          workoutSessionId: ex.workoutSessionId,

          exerciseId: ex.exerciseId,
          templateExerciseId: ex.exerciseProgramId,
          templateExercise: undefined,

          exerciseName: ex.exerciseName,

          orderIndex: ex.orderIndex,

          note: ex.note,

          createdAt: new Date(ex.createdAt),
          updatedAt: new Date(ex.updatedAt),

          sets,
        };

        return sessionExercise;
      }
    );

    return {
      id: result.id,

      startedAt: new Date(result.startedAt),
      endedAt: result.endedAt ? new Date(result.endedAt) : null,

      sourceTemplateId: result.sourceProgramId ?? null,
      sourceTemplate: undefined,

      note: result.note,

      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),

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

      sourceProgramId: domain.sourceTemplateId,

      note: domain.note,

      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  static toRow(domain: SessionWorkout): SessionWorkoutRow {
    return this.fromDomain(domain);
  }

  static toRowTree(domain: SessionWorkout): {
    workout: SessionWorkoutRow;
    exercises: SessionExerciseRow[];
    sets: SessionSetRow[];
  } {
    const workout: SessionWorkoutRow = this.fromDomain(domain);

    const exercises: SessionExerciseRow[] = [];
    const sets: SessionSetRow[] = [];

    for (const ex of domain.exercises ?? []) {
      const exRow: SessionExerciseRow = {
        id: ex.id,
        workoutSessionId: ex.workoutSessionId,
        exerciseId: ex.exerciseId,
        exerciseProgramId: ex.templateExerciseId,
        exerciseName: ex.exerciseName,
        orderIndex: ex.orderIndex,
        note: ex.note,
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      };

      exercises.push(exRow);

      for (const s of ex.sets ?? []) {
        const setRow: SessionSetRow = {
          id: s.id,

          sessionExerciseId: s.sessionExerciseId,
          setProgramId: s.templateSetId,

          orderIndex: s.orderIndex,

          reps: s.reps,
          loadUnit: s.loadUnit,
          loadValue: s.loadValue,
          rpe: s.rpe,

          isWarmup: s.isWarmup,

          note: s.note,

          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        };

        sets.push(setRow);
      }
    }

    return { workout, exercises, sets };
  }
}
