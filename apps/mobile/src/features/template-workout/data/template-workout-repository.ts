// src/features/workoutTemplate/data/workout-template-repository.ts
import { TemplateWorkout } from "../domain/type";
import { WorkoutTemplateDao } from "./template-workout-dao";
import { WorkoutTemplateRow } from "./type";

import { TemplateExercise } from "../../template-exercise/domain/type";
import { TemplateExerciseDao } from "../../template-exercise/data/template-exercise-dao";
import { TemplateExerciseRow } from "../../template-exercise/data/type";

import { TemplateSet } from "../../template-set/domain/type";
import { TemplateSetDao } from "../../template-set/data/template-set-dao";
import { TemplateSetRow } from "../../template-set/data/type";

import { BaseRepository } from "@/src/lib/base-repository";

export class WorkoutTemplateRepository extends BaseRepository<TemplateWorkout> {
  constructor(
    private readonly templateDao: WorkoutTemplateDao,
    private readonly exerciseDao: TemplateExerciseDao,
    private readonly setDao: TemplateSetDao
  ) {
    super();
  }

  // -----------------------------
  // Mapping
  // -----------------------------

  private _toEntity(
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

  private _toRow(entity: TemplateWorkout): WorkoutTemplateRow {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private _mapSet(row: TemplateSetRow): TemplateSet {
    return {
      id: row.id,
      templateExerciseId: row.template_exercise_id,
      orderIndex: row.order_index,
      targetReps: row.target_reps,
      targetWeight: row.target_weight,
      targetRpe: row.target_rpe,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private _toSetRow(
    templateExerciseId: string,
    set: TemplateSet
  ): TemplateSetRow {
    return {
      id: set.id,
      template_exercise_id: templateExerciseId,
      order_index: set.orderIndex,
      target_reps: set.targetReps,
      target_weight: set.targetWeight,
      target_rpe: set.targetRpe,
      notes: set.notes,
      created_at: set.createdAt.toISOString(),
      updated_at: set.updatedAt.toISOString(),
    };
  }

  private async _mapExerciseWithSets(
    row: TemplateExerciseRow
  ): Promise<TemplateExercise> {
    const setRows = await this.setDao.findByTemplateExerciseId(row.id);
    const sets = setRows.map((s) => this._mapSet(s));

    return {
      id: row.id,
      exerciseId: row.exercise_id,
      orderIndex: row.order_index,
      notes: row.notes,
      sets,
    };
  }

  // -----------------------------
  // Public methods
  // -----------------------------

  async get(id: string): Promise<TemplateWorkout | null> {
    const row = await this.templateDao.findById(id);
    if (!row) return null;

    const exerciseRows = await this.exerciseDao.findByTemplateId(id);
    const exercises: TemplateExercise[] = [];

    for (const exRow of exerciseRows) {
      exercises.push(await this._mapExerciseWithSets(exRow));
    }

    return this._toEntity(row, exercises);
  }

  async getAll(): Promise<TemplateWorkout[]> {
    const rows = await this.templateDao.findAllOrdered();
    const results: TemplateWorkout[] = [];

    for (const row of rows) {
      const exerciseRows = await this.exerciseDao.findByTemplateId(row.id);
      const exercises: TemplateExercise[] = [];

      for (const exRow of exerciseRows) {
        exercises.push(await this._mapExerciseWithSets(exRow));
      }

      results.push(this._toEntity(row, exercises));
    }

    return results;
  }

  protected async insert(entity: TemplateWorkout): Promise<TemplateWorkout> {
    const row = this._toRow(entity);
    await this.templateDao.insert(row);

    for (const ex of entity.exercises) {
      const exRow: TemplateExerciseRow = {
        id: ex.id,
        workout_template_id: entity.id,
        exercise_id: ex.exerciseId,
        order_index: ex.orderIndex,
        notes: ex.notes,
        created_at: entity.createdAt.toISOString(),
        updated_at: entity.updatedAt.toISOString(),
      };

      await this.exerciseDao.insert(exRow);

      for (const set of ex.sets) {
        await this.setDao.insert(this._toSetRow(ex.id, set));
      }
    }

    return entity;
  }

  protected async update(entity: TemplateWorkout): Promise<TemplateWorkout> {
    const row = this._toRow(entity);

    await this.templateDao.update(entity.id, {
      name: row.name,
      description: row.description,
      updated_at: row.updated_at,
    });

    // wipe old children, reinsert
    await this.setDao.deleteByTemplateId(entity.id);
    await this.exerciseDao.deleteByTemplateId(entity.id);

    for (const ex of entity.exercises) {
      const exRow: TemplateExerciseRow = {
        id: ex.id,
        workout_template_id: entity.id,
        exercise_id: ex.exerciseId,
        order_index: ex.orderIndex,
        notes: ex.notes,
        created_at: entity.createdAt.toISOString(),
        updated_at: entity.updatedAt.toISOString(),
      };

      await this.exerciseDao.insert(exRow);

      for (const set of ex.sets) {
        await this.setDao.insert(this._toSetRow(ex.id, set));
      }
    }

    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.setDao.deleteByTemplateId(id);
    await this.exerciseDao.deleteByTemplateId(id);
    await this.templateDao.delete(id);
  }
}
