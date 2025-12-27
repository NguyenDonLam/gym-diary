// src/features/program-stats/data/program-stat-repository.ts

import type { ProgramStat } from "../domain/types";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { BaseRepository } from "@/src/lib/base-repository";
import { programStats } from "@/db/schema";

import type { ProgramStatRow } from "./types";
import { ProgramStatFactory } from "../domain/factory";

export class ProgramStatRepository extends BaseRepository<ProgramStat> {
  async get(programId: string): Promise<ProgramStat | null> {
    const rows: ProgramStatRow[] = await db
      .select()
      .from(programStats)
      .where(eq(programStats.programId, programId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ProgramStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ProgramStat[]> {
    const rows: ProgramStatRow[] = await db.select().from(programStats);
    return rows.map((r) => ProgramStatFactory.domainFromDb(r));
  }

  protected async insert(entity: ProgramStat): Promise<ProgramStat> {
    const row = ProgramStatFactory.dbFromDomain(entity);

    await db.insert(programStats).values(row);

    return entity;
  }

  protected async update(entity: ProgramStat): Promise<ProgramStat> {
    const row = ProgramStatFactory.dbFromDomain(entity);

    await db
      .update(programStats)
      .set(row)
      .where(eq(programStats.programId, entity.programId));

    return entity;
  }

  async delete(programId: string): Promise<void> {
    await db.delete(programStats).where(eq(programStats.programId, programId));
  }

  async save(entity: ProgramStat): Promise<ProgramStat> {
    const existing = await this.get(entity.programId);
    if (existing) return this.update(entity);
    return this.insert(entity);
  }
}

export const programStatRepository = new ProgramStatRepository();
