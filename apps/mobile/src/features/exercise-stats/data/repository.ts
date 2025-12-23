// src/features/exercise-stat/data/exercise-stat-repository.ts

import type { ExerciseStat } from "../domain/types";

import { eq } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exerciseStats } from "@/db/schema";
import { db } from "@/db";

import type { ExerciseStatRow } from "./types";
import { ExerciseStatFactory } from "../domain/factory";

export class ExerciseStatRepository extends BaseRepository<ExerciseStat> {
  async get(exerciseId: string): Promise<ExerciseStat | null> {
    const rows: ExerciseStatRow[] = await db
      .select()
      .from(exerciseStats)
      .where(eq(exerciseStats.exerciseId, exerciseId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ExerciseStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ExerciseStat[]> {
    const rows: ExerciseStatRow[] = await db.select().from(exerciseStats);
    return rows.map((r) => ExerciseStatFactory.domainFromDb(r));
  }

  protected async insert(entity: ExerciseStat): Promise<ExerciseStat> {
    const row = ExerciseStatFactory.dbFromDomain(entity);

    await db.insert(exerciseStats).values(row);

    return entity;
  }

  protected async update(entity: ExerciseStat): Promise<ExerciseStat> {
    const row = ExerciseStatFactory.dbFromDomain(entity);

    await db
      .update(exerciseStats)
      .set(row)
      .where(eq(exerciseStats.exerciseId, entity.exerciseId));

    return entity;
  }

  async delete(exerciseId: string): Promise<void> {
    await db
      .delete(exerciseStats)
      .where(eq(exerciseStats.exerciseId, exerciseId));
  }

  async save(entity: ExerciseStat): Promise<ExerciseStat> {
    const existing = await this.get(entity.exerciseId);
    if (existing) {
      return this.update(entity);
    }
    return this.insert(entity);
  }
}

export const exerciseStatRepository = new ExerciseStatRepository();
