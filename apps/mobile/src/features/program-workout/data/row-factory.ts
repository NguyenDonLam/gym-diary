// src/features/program-workout/data/row-factory.ts
import { InferSelectModel } from "drizzle-orm";

import {
  ProgramColor,
  WorkoutProgram,
} from "@/src/features/program-workout/domain/type";
import { TemplateExercise } from "@/src/features/template-exercise/domain/type";
import { WorkoutProgramRow } from "./type";

import { exercisePrograms, setPrograms } from "@/db/schema";

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
    sets: SetProgramRow[];
  })[];
};

/**
 * Factory responsible ONLY for mapping between:
 *   - DB row shapes (WorkoutProgramRow + related rows)
 *   - Domain aggregate (WorkoutProgram)
 *
 * It does not know about forms or UI.
 */
export class WorkoutProgramRowFactory {
  /**
   * DB row + already-mapped exercises -> domain aggregate.
   * Use this if you load/mapped exercises elsewhere.
   */
  static toDomain(
    row: WorkoutProgramRow,
    exercises: TemplateExercise[]
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

  /**
   * Domain aggregate -> DB row for program_workouts table.
   * Exercises are NOT handled here; they are persisted via their own factories.
   */
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
    exercises: TemplateExercise[]
  ): WorkoutProgram {
    return this.toDomain(row, exercises);
  }

  /**
   * Map a full Drizzle query result (program + exercises + sets)
   * into the WorkoutProgram domain aggregate.
   */
  static fromQuery(result: WorkoutProgramQueryResult): WorkoutProgram {
    const exercises: TemplateExercise[] = (result.exercises ?? []).map(
      (ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        orderIndex: ex.orderIndex,
        notes: ex.note,
        sets: (ex.sets ?? []).map((s) => ({
          id: s.id,
          // domain still uses "templateExerciseId" for the parent link
          templateExerciseId: ex.id,
          orderIndex: s.orderIndex,
          targetReps: s.targetReps,
          loadUnit: s.loadUnit, // cast if your domain uses a narrower union
          loadValue: s.loadValue,
          targetRpe: s.targetRpe,
          notes: s.note,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
      })
    );

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
}
