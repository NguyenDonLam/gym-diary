// src/features/program-workout/data/row-factory.ts
import { InferSelectModel } from "drizzle-orm";

import {
  ProgramColor,
  WorkoutProgram,
} from "@/src/features/program-workout/domain/type";
import { WorkoutProgramRow } from "./type";

import { exercisePrograms, setPrograms } from "@/db/schema";
import { ExerciseProgram } from "../../program-exercise/domain/type";
import { LoadUnit, SetProgram } from "../../program-set/domain/type";
import { ExerciseRow } from "../../exercise/data/types";

/**
 * Drizzle row types for relations
 */
type ExerciseProgramRow = InferSelectModel<typeof exercisePrograms>;
type SetProgramRow = InferSelectModel<typeof setPrograms>;

/**
 * Shape returned by:
 * db.query.workoutPrograms.findFirst/findMany({
 *   with: { exercises: { with: { sets: true } } }
 * })
 */
type WorkoutProgramQueryResult = WorkoutProgramRow & {
  exercises: (ExerciseProgramRow & {
    exercise: ExerciseRow;
    sets: SetProgramRow[];
  })[];
};

export class WorkoutProgramRowFactory {
  // ------------------------
  // Existing methods
  // ------------------------

  static toDomain(
    row: WorkoutProgramRow,
    exercises: ExerciseProgram[]
  ): WorkoutProgram {
    return {
      id: row.id,
      name: row.name,
      color: row.color as ProgramColor,
      folderId: row.folderId,
      description: row.description,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      exercises,
    };
  }

  static fromDomain(domain: WorkoutProgram): WorkoutProgramRow {
    return {
      id: domain.id,
      name: domain.name,
      color: domain.color,
      folderId: domain.folderId,
      description: domain.description,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  static toRow(domain: WorkoutProgram): WorkoutProgramRow {
    return this.fromDomain(domain);
  }

  static fromRow(
    row: WorkoutProgramRow,
    exercises: ExerciseProgram[]
  ): WorkoutProgram {
    return this.toDomain(row, exercises);
  }

  static fromQuery(result: WorkoutProgramQueryResult): WorkoutProgram {
    const exercises: ExerciseProgram[] = (result.exercises ?? []).map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      exercise: ex.exercise
        ? {
            ...ex.exercise,
            createdAt: new Date(ex.exercise.createdAt),
            updatedAt: new Date(ex.exercise.updatedAt),
          }
        : undefined,
      orderIndex: ex.orderIndex,
      note: ex.note,
      createdAt: new Date(ex.createdAt),
      updatedAt: new Date(ex.updatedAt),
      sets: (ex.sets ?? []).map((s) => ({
        id: s.id,
        exerciseProgramId: ex.id,
        orderIndex: s.orderIndex,
        targetQuantity: s.targetQuantity ?? null,
        loadUnit: s.loadUnit as LoadUnit,
        loadValue: s.loadValue,
        targetRpe: s.targetRpe,
        note: s.note,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      })),
    }));

    return {
      id: result.id,
      name: result.name,
      color: result.color as ProgramColor,
      folderId: result.folderId,
      description: result.description,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      exercises,
    };
  }

  /**
   * Map domain aggregate -> raw insert/update rows for:
   *   - program_exercises
   *   - program_sets
   *
   * No ID or timestamp generation here: caller must ensure
   * ids / createdAt / updatedAt are already set on the domain objects.
   */
  static toChildRows(domain: WorkoutProgram): {
    exerciseProgramRows: (typeof exercisePrograms.$inferInsert)[];
    setProgramRows: (typeof setPrograms.$inferInsert)[];
  } {
    const exerciseProgramRows: (typeof exercisePrograms.$inferInsert)[] = [];
    const setProgramRows: (typeof setPrograms.$inferInsert)[] = [];

    for (const ex of domain.exercises) {
      if (!ex.id) {
        throw new Error("ExerciseProgram.id must be set before persisting");
      }

      const exerciseRow: ExerciseProgramRow = {
        id: ex.id,
        workoutProgramId: domain.id,
        exerciseId: ex.exerciseId,
        orderIndex: ex.orderIndex,
        note: ex.note ?? null,
        // Fill these from your domain model; do not invent values here.
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString(),
      };

      exerciseProgramRows.push(exerciseRow);

      for (const set of ex.sets) {
        if (!set.id) {
          throw new Error("SetProgram.id must be set before persisting");
        }

        const setRow: SetProgramRow = {
          id: set.id,
          exerciseProgramId: ex.id,
          orderIndex: set.orderIndex,
          targetQuantity: set.targetQuantity ?? null,
          loadUnit: set.loadUnit,
          loadValue:
            set.loadValue === null || set.loadValue === undefined
              ? null
              : String(set.loadValue),
          targetRpe: set.targetRpe,
          note: set.note ?? null,
          createdAt: set.createdAt.toISOString(),
          updatedAt: set.updatedAt.toISOString(),
        };

        setProgramRows.push(setRow);
      }
    }

    return { exerciseProgramRows, setProgramRows };
  }
}
