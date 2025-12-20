// src/features/exercise-period-stats/data/exercise-period-stat-repository.ts

import type { ExercisePeriodStat } from "../domain/types";

import { eq } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exercisePeriodStats } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";

import type { ExercisePeriodStatRow } from "./types";
import { ExercisePeriodStatFactory } from "../domain/factory";

export class ExercisePeriodStatRepository extends BaseRepository<ExercisePeriodStat> {
  async get(id: string): Promise<ExercisePeriodStat | null> {
    const rows: ExercisePeriodStatRow[] = await db
      .select()
      .from(exercisePeriodStats)
      .where(eq(exercisePeriodStats.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ExercisePeriodStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ExercisePeriodStat[]> {
    const rows: ExercisePeriodStatRow[] = await db
      .select()
      .from(exercisePeriodStats);

    return rows.map((r) => ExercisePeriodStatFactory.domainFromDb(r));
  }

  protected async insert(
    entity: ExercisePeriodStat & { id?: string | null }
  ): Promise<ExercisePeriodStat> {
    const id = entity.id ?? generateId();
    const withId: ExercisePeriodStat = {
      ...(entity as ExercisePeriodStat),
      id,
    };

    const row = ExercisePeriodStatFactory.dbFromDomain(withId);

    await db.insert(exercisePeriodStats).values(row);

    return withId;
  }

  protected async update(
    entity: ExercisePeriodStat & { id?: string | null }
  ): Promise<ExercisePeriodStat> {
    if (!entity.id)
      throw new Error("Cannot update ExercisePeriodStat without id");

    const row = ExercisePeriodStatFactory.dbFromDomain(
      entity as ExercisePeriodStat
    );

    await db
      .update(exercisePeriodStats)
      .set(row)
      .where(eq(exercisePeriodStats.id, entity.id));

    return entity as ExercisePeriodStat;
  }

  async delete(id: string): Promise<void> {
    await db.delete(exercisePeriodStats).where(eq(exercisePeriodStats.id, id));
  }
}

export const exercisePeriodStatRepository = new ExercisePeriodStatRepository();
