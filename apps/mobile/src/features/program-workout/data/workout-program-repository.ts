import { eq, asc, inArray } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exercisePrograms, setPrograms, workoutPrograms } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { WorkoutProgram } from "../domain/type";
import { WorkoutProgramFactory } from "../domain/factory";

export class WorkoutProgramRepository extends BaseRepository<WorkoutProgram> {
  constructor() {
    super();
  }

  async get(id: string): Promise<WorkoutProgram | null> {
    try {
      const program = await db.query.workoutPrograms.findFirst({
        where: (wp, { eq }) => eq(wp.id, id),
        with: {
          exercises: {
            with: {
              exercise: true,
              sets: true,
            },
            orderBy: (ex, { asc }) => [asc(ex.orderIndex)],
          },
        },
      });
      if (!program) return null;

      return WorkoutProgramFactory.domainFromDb(program);
    } catch (error) {
      console.error("WorkoutProgramRepository.get error:", error);
      throw error;
    }
  }

  async getAll(): Promise<WorkoutProgram[]> {
    const rows = await db
      .select()
      .from(workoutPrograms)
      .orderBy(asc(workoutPrograms.createdAt));

    return rows.map((row) => WorkoutProgramFactory.domainFromDb(row));
  }

  protected async insert(
    entity: WorkoutProgram & { id?: string | null }
  ): Promise<WorkoutProgram> {
    const programId = entity.id ?? generateId();

    const withId: WorkoutProgram = {
      ...entity,
      id: programId,
    };

    const graph = WorkoutProgramFactory.dbFromDomain(withId);

    await db.transaction(async (tx) => {
      // 1) Insert root
      await tx.insert(workoutPrograms).values(graph.workoutPrograms);

      // 2) Insert exercise programs
      if (graph.exercisePrograms.length > 0) {
        const exerciseRows: (typeof exercisePrograms.$inferInsert)[] =
          graph.exercisePrograms.map((r) => {
            const {
              sets: _sets,
              exercise: _exercise,
              workoutProgram: _workoutProgram,
              ...rest
            } = r;

            return {
              ...rest,
              id: r.id ?? generateId(),
              workoutProgramId: programId, // enforce FK
            };
          });

        await tx.insert(exercisePrograms).values(exerciseRows);
      }

      // 3) Insert set programs
      if (graph.setPrograms.length > 0) {
        const setRows: (typeof setPrograms.$inferInsert)[] =
          graph.setPrograms.map((r) => {
            const { exerciseProgram: _exerciseProgram, ...rest } = r;

            return {
              ...rest,
              id: r.id ?? generateId(),
              // exerciseProgramId already set by factory; keep it
            };
          });

        await tx.insert(setPrograms).values(setRows);
      }
    });

    return withId;
  }

  protected async update(
    entity: WorkoutProgram & { id?: string | null }
  ): Promise<WorkoutProgram> {
    if (!entity.id) throw new Error("Cannot update WorkoutProgram without id");

    const graph = WorkoutProgramFactory.dbFromDomain(entity);

    const programRow = graph.workoutPrograms[0];
    if (!programRow) throw new Error("Factory did not produce program row");

    // never update primary key; never persist hydrated relation field
    const {
      id: _ignoreProgramId,
      exercisePrograms: _rel,
      ...programUpdate
    } = programRow;

    await db.transaction(async (tx) => {
      //
      // 1) UPDATE root row
      //
      await tx
        .update(workoutPrograms)
        .set(programUpdate)
        .where(eq(workoutPrograms.id, entity.id!));

      //
      // 2) LOAD existing children for diff
      //
      const dbExercises = await tx
        .select()
        .from(exercisePrograms)
        .where(eq(exercisePrograms.workoutProgramId, entity.id!));

      const dbExerciseIds = new Set(dbExercises.map((x) => x.id));

      const dbSets =
        dbExercises.length === 0
          ? []
          : await tx
              .select()
              .from(setPrograms)
              .where(
                inArray(
                  setPrograms.exerciseProgramId,
                  dbExercises.map((x) => x.id)
                )
              );

      const dbSetIds = new Set(dbSets.map((x) => x.id));

      //
      // 3) MAP factory children into rows keyed by id (force FK + drop relations)
      //
      const domainExerciseRows = new Map<
        string,
        typeof exercisePrograms.$inferInsert
      >();

      for (const r of graph.exercisePrograms) {
        const {
          sets: _sets,
          exercise: _exercise,
          workoutProgram: _workoutProgram,
          ...rest
        } = r;

        const id = r.id ?? generateId();

        domainExerciseRows.set(id, {
          ...rest,
          id,
          workoutProgramId: entity.id!, // enforce FK
        });
      }

      const domainSetRows = new Map<string, typeof setPrograms.$inferInsert>();

      for (const r of graph.setPrograms) {
        const { exerciseProgram: _exerciseProgram, ...rest } = r;

        const id = r.id ?? generateId();

        domainSetRows.set(id, {
          ...rest,
          id,
          // keep exerciseProgramId from factory; it should already point at the correct exerciseProgram row id
        });
      }

      //
      // 4) DIFF – exercises
      //
      const exercisesToInsert: (typeof exercisePrograms.$inferInsert)[] = [];
      const exercisesToUpdate: (typeof exercisePrograms.$inferInsert)[] = [];
      const exercisesToDelete: string[] = [];

      for (const [id, row] of domainExerciseRows) {
        if (dbExerciseIds.has(id)) exercisesToUpdate.push(row);
        else exercisesToInsert.push(row);
      }

      for (const id of dbExerciseIds) {
        if (!domainExerciseRows.has(id)) exercisesToDelete.push(id);
      }

      //
      // 5) DIFF – sets
      //
      const setsToInsert: (typeof setPrograms.$inferInsert)[] = [];
      const setsToUpdate: (typeof setPrograms.$inferInsert)[] = [];
      const setsToDelete: string[] = [];

      for (const [id, row] of domainSetRows) {
        if (dbSetIds.has(id)) setsToUpdate.push(row);
        else setsToInsert.push(row);
      }

      for (const id of dbSetIds) {
        if (!domainSetRows.has(id)) setsToDelete.push(id);
      }

      //
      // 6) APPLY MUTATIONS (order matters)
      //

      // delete sets first
      if (setsToDelete.length > 0) {
        await tx
          .delete(setPrograms)
          .where(inArray(setPrograms.id, setsToDelete));
      }

      // delete removed exercises (after their sets are gone)
      if (exercisesToDelete.length > 0) {
        await tx
          .delete(exercisePrograms)
          .where(inArray(exercisePrograms.id, exercisesToDelete));
      }

      // update exercises (no PK updates)
      for (const row of exercisesToUpdate) {
        const { id, ...update } = row;
        if (!id) continue;

        await tx
          .update(exercisePrograms)
          .set(update)
          .where(eq(exercisePrograms.id, id));
      }

      // insert new exercises
      if (exercisesToInsert.length > 0) {
        await tx.insert(exercisePrograms).values(exercisesToInsert);
      }

      // update sets (no PK updates)
      for (const row of setsToUpdate) {
        const { id, ...update } = row;
        if (!id) continue;

        await tx.update(setPrograms).set(update).where(eq(setPrograms.id, id));
      }

      // insert new sets
      if (setsToInsert.length > 0) {
        await tx.insert(setPrograms).values(setsToInsert);
      }
    });

    return entity;
  }

  async delete(id: string): Promise<void> {
    await db.delete(workoutPrograms).where(eq(workoutPrograms.id, id));
  }
}

export const workoutProgramRepository = new WorkoutProgramRepository();
