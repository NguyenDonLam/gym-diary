import { eq, asc, inArray } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { db } from "@/db";
import { setPrograms } from "@/db/schema";

import type { SetProgram } from "../domain/type";
import { SetProgramFactory } from "./factory";

export class SetProgramRepository extends BaseRepository<SetProgram> {
  constructor() {
    super();
  }

  async get(id: string): Promise<SetProgram | null> {
    const row = await db.query.setPrograms.findFirst({
      where: (sp, { eq }) => eq(sp.id, id),
      // include relation if you want it available on the row:
      // with: { exerciseProgram: true },
    });

    if (!row) return null;
    return SetProgramFactory.DBToDomain(row);
  }

  async getAll(): Promise<SetProgram[]> {
    const rows = await db.query.setPrograms.findMany({
      orderBy: (sp, { asc }) => [asc(sp.createdAt)],
    });

    return rows.map((r) => SetProgramFactory.DBToDomain(r));
  }

  async getAllForExerciseProgram(
    exerciseProgramId: string
  ): Promise<SetProgram[]> {
    const rows = await db.query.setPrograms.findMany({
      where: (sp, { eq }) => eq(sp.exerciseProgramId, exerciseProgramId),
      orderBy: (sp, { asc }) => [asc(sp.orderIndex)],
    });

    return rows.map((r) => SetProgramFactory.DBToDomain(r));
  }

  protected async insert(
    entity: SetProgram & { id?: string | null }
  ): Promise<SetProgram> {
    const row = SetProgramFactory.DomainToDB(entity);

    await db.insert(setPrograms).values(row);

    return entity;
  }

  protected async update(
    entity: SetProgram & { id?: string | null }
  ): Promise<SetProgram> {
    if (!entity.id) throw new Error("Cannot update SetProgram without id");

    const row = SetProgramFactory.DomainToDB(entity);
    const { id: _ignore, exerciseProgram: _rel, ...updateData } = row;

    await db
      .update(setPrograms)
      .set(updateData)
      .where(eq(setPrograms.id, entity.id));

    return entity as SetProgram;
  }

  async delete(id: string): Promise<void> {
    await db.delete(setPrograms).where(eq(setPrograms.id, id));
  }
}

export const setProgramRepository = new SetProgramRepository();
