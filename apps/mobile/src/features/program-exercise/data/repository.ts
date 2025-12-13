import { eq, asc, inArray } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { db } from "@/db";
import { exercisePrograms, setPrograms } from "@/db/schema";
import { generateId } from "@/src/lib/id";
import { ExerciseProgram } from "../../program-exercise/domain/type";
import { ProgramExerciseFactory } from "./factory";
export class ExerciseProgramRepository extends BaseRepository<ExerciseProgram> {
  constructor() {
    super();
  }

  async get(id: string): Promise<ExerciseProgram | null> {
    const row = await db.query.exercisePrograms.findFirst({
      where: (ep, { eq }) => eq(ep.id, id),
      with: {
        sets: { orderBy: (sp, { asc }) => [asc(sp.orderIndex)] },
        // include if you want domain.exercise hydrated:
        // exercise: true,
      },
    });

    if (!row) return null;

    return ProgramExerciseFactory.DBToDomain(row);
  }

  async getAll(): Promise<ExerciseProgram[]> {
    const rows = await db.query.exercisePrograms.findMany({
      with: {
        sets: { orderBy: (sp, { asc }) => [asc(sp.orderIndex)] },
        // exercise: true,
      },
      orderBy: (ep, { asc }) => [asc(ep.createdAt)],
    });

    return rows.map((r) => ProgramExerciseFactory.DBToDomain(r as any));
  }

  async getAllForProgram(workoutProgramId: string): Promise<ExerciseProgram[]> {
    const rows = await db.query.exercisePrograms.findMany({
      where: (ep, { eq }) => eq(ep.workoutProgramId, workoutProgramId),
      with: {
        sets: { orderBy: (sp, { asc }) => [asc(sp.orderIndex)] },
        exercise: true,
      },
      orderBy: (ep, { asc }) => [asc(ep.orderIndex)],
    });

    return rows.map((r) => ProgramExerciseFactory.DBToDomain(r));
  }

  protected async insert(
    entity: ExerciseProgram & { id?: string | null }
  ): Promise<ExerciseProgram> {
    const exerciseProgramId = entity.id ?? generateId();

    const withId: ExerciseProgram = {
      ...(entity as ExerciseProgram),
      id: exerciseProgramId,
    };
    const graph = ProgramExerciseFactory.DomainToDB(withId);

    await db.transaction(async (tx) => {
      await tx.insert(exercisePrograms).values(graph.exerciseProgram);

      if (graph.setPrograms.length > 0) {
        await tx.insert(setPrograms).values(graph.setPrograms);
      }
    });

    return withId;
  }

  protected async update(
    entity: ExerciseProgram & { id?: string | null }
  ): Promise<ExerciseProgram> {
    if (!entity.id) throw new Error("Cannot update ExerciseProgram without id");

    const graph = ProgramExerciseFactory.DomainToDB(entity as ExerciseProgram);
    const { exerciseProgram: programRow, setPrograms: domainSetRows } = graph;

    // never update primary key
    const {
      id: _ignore,
      sets: _sets,
      exercise: _exercise,
      ...programUpdate
    } = programRow;

    await db.transaction(async (tx) => {
      //
      // 1) UPDATE root row
      //
      await tx
        .update(exercisePrograms)
        .set(programUpdate)
        .where(eq(exercisePrograms.id, entity.id!));

      //
      // 2) LOAD existing sets for diff
      //
      const dbSets = await tx
        .select()
        .from(setPrograms)
        .where(eq(setPrograms.exerciseProgramId, entity.id!));

      const dbSetIds = new Set(dbSets.map((x) => x.id));

      //
      // 3) MAP domain sets into rows keyed by id
      //
      const domainSetsById = new Map<string, typeof setPrograms.$inferInsert>();

      for (const s of domainSetRows) {
        const id = s.id ?? generateId();
        domainSetsById.set(id, {
          ...s,
          id,
          exerciseProgramId: entity.id!,
        });
      }

      //
      // 4) DIFF – Decide insert/update/delete for sets
      //
      const setsToInsert: (typeof setPrograms.$inferInsert)[] = [];
      const setsToUpdate: (typeof setPrograms.$inferInsert)[] = [];
      const setsToDelete: string[] = [];

      for (const [id, row] of domainSetsById) {
        if (dbSetIds.has(id)) setsToUpdate.push(row);
        else setsToInsert.push(row);
      }

      for (const id of dbSetIds) {
        if (!domainSetsById.has(id)) setsToDelete.push(id);
      }

      //
      // 5) APPLY MUTATIONS
      //
      if (setsToDelete.length > 0) {
        await tx
          .delete(setPrograms)
          .where(inArray(setPrograms.id, setsToDelete));
      }

      for (const row of setsToUpdate) {
        await tx
          .update(setPrograms)
          .set(row)
          .where(eq(setPrograms.id, row.id!));
      }

      if (setsToInsert.length > 0) {
        await tx.insert(setPrograms).values(setsToInsert);
      }
    });

    return entity;
  }

  async delete(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(setPrograms).where(eq(setPrograms.exerciseProgramId, id));
      await tx.delete(exercisePrograms).where(eq(exercisePrograms.id, id));
    });
  }
}

export const exerciseProgramRepository = new ExerciseProgramRepository();
