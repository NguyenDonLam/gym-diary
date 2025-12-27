// src/features/program-period-stats/data/program-period-stat-repository.ts

import type { ProgramPeriodStat } from "../domain/types";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { BaseRepository } from "@/src/lib/base-repository";
import { programPeriodStats } from "@/db/schema";

import type { ProgramPeriodStatRow } from "./types";
import { ProgramPeriodStatFactory } from "../domain/factory";

export class ProgramPeriodStatRepository extends BaseRepository<ProgramPeriodStat> {
  async get(id: string): Promise<ProgramPeriodStat | null> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats)
      .where(eq(programPeriodStats.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ProgramPeriodStatFactory.domainFromDb(row);
  }

  async getAll(): Promise<ProgramPeriodStat[]> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats);
    return rows.map((r) => ProgramPeriodStatFactory.domainFromDb(r));
  }

  async getAllForProgram(programId: string): Promise<ProgramPeriodStat[]> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats)
      .where(eq(programPeriodStats.programId, programId));

    return rows.map((r) => ProgramPeriodStatFactory.domainFromDb(r));
  }

  async getOneForProgramPeriod(
    programId: string,
    periodType: ProgramPeriodStat["periodType"],
    periodStart: Date
  ): Promise<ProgramPeriodStat | null> {
    const rows: ProgramPeriodStatRow[] = await db
      .select()
      .from(programPeriodStats)
      .where(
        and(
          eq(programPeriodStats.programId, programId),
          eq(programPeriodStats.periodType, periodType),
          eq(programPeriodStats.periodStart, periodStart)
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return ProgramPeriodStatFactory.domainFromDb(row);
  }

  protected async insert(
    entity: ProgramPeriodStat
  ): Promise<ProgramPeriodStat> {
    const row = ProgramPeriodStatFactory.dbFromDomain(entity);
    await db.insert(programPeriodStats).values(row);
    return entity;
  }

  protected async update(
    entity: ProgramPeriodStat
  ): Promise<ProgramPeriodStat> {
    const row = ProgramPeriodStatFactory.dbFromDomain(entity);

    await db
      .update(programPeriodStats)
      .set(row)
      .where(eq(programPeriodStats.id, entity.id));

    return entity;
  }

  async delete(id: string): Promise<void> {
    await db.delete(programPeriodStats).where(eq(programPeriodStats.id, id));
  }

  async save(entity: ProgramPeriodStat): Promise<ProgramPeriodStat> {
    const existing = await this.get(entity.id);
    if (existing) return this.update(entity);
    return this.insert(entity);
  }
}

export const programPeriodStatRepository = new ProgramPeriodStatRepository();
