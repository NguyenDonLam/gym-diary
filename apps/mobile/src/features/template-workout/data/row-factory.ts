// features/template-workout/data/row-factory.ts
import { TemplateWorkout } from "@/src/features/template-workout/domain/type";
import { TemplateExercise } from "@/src/features/template-exercise/domain/type";
import { WorkoutTemplateRow } from "./type";

/**
 * Factory responsible ONLY for mapping between:
 *   - DB row shape (WorkoutTemplateRow)
 *   - Domain aggregate (TemplateWorkout)
 *
 * It does not know about forms or UI.
 */
export class TemplateWorkoutRowFactory {
  /**
   * DB row + already-loaded exercises -> domain aggregate
   *
   * Exercises (and their sets) should be mapped by their own factories
   * and passed in here as domain objects.
   */
  static toDomain(
    row: WorkoutTemplateRow,
    exercises: TemplateExercise[]
  ): TemplateWorkout {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      exercises,
    };
  }

  /**
   * Domain aggregate -> DB row for the workout_templates table.
   *
   * Exercises are NOT handled here; they should be persisted via
   * their own row factories / DAOs.
   */
  static fromDomain(domain: TemplateWorkout): WorkoutTemplateRow {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
    };
  }

  static toRow(domain: TemplateWorkout): WorkoutTemplateRow {
    return this.fromDomain(domain);
  }

  static fromRow(
    row: WorkoutTemplateRow,
    exercises: TemplateExercise[]
  ): TemplateWorkout {
    return this.toDomain(row, exercises);
  }
}
