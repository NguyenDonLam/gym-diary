import { eq, asc, inArray } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exercisePrograms, setPrograms, workoutPrograms } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { WorkoutProgramRowFactory } from "./row-factory";
import { WorkoutProgram } from "../domain/type";

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

      return WorkoutProgramRowFactory.fromQuery(program);
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

    return rows.map((row) => WorkoutProgramRowFactory.toDomain(row, []));
  }

  protected async insert(
    entity: WorkoutProgram & { id?: string | null }
  ): Promise<WorkoutProgram> {
    // 1. Ensure program id
    const programId = entity.id ?? generateId();
    const withId: WorkoutProgram = {
      ...(entity as WorkoutProgram),
      id: programId,
    };

    // Root row
    const programRow = WorkoutProgramRowFactory.toRow(withId);

    await db.transaction(async (tx) => {
      // 2. Insert program row
      await tx.insert(workoutPrograms).values(programRow);

      const exerciseRows: (typeof exercisePrograms.$inferInsert)[] = [];
      const setRows: (typeof setPrograms.$inferInsert)[] = [];

      // 3. Map domain exercises -> program_exercises / program_sets
      for (const ex of withId.exercises) {
        if (ex.orderIndex === undefined || ex.orderIndex === null) {
          throw new Error(
            "ExerciseProgram.orderIndex must be set before insert"
          );
        }
        if (!ex.exerciseId) {
          throw new Error(
            "ExerciseProgram.exerciseId must be set before insert"
          );
        }

        const exerciseProgramId = ex.id ?? generateId();

        if (!ex.createdAt || !ex.updatedAt) {
          throw new Error(
            "ExerciseProgram.createdAt/updatedAt must be set before insert"
          );
        }

        exerciseRows.push({
          id: exerciseProgramId,
          workoutProgramId: programId,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          note: ex.note ?? null,
          createdAt: ex.createdAt.toISOString(),
          updatedAt: ex.updatedAt.toISOString(),
        });

        for (const s of ex.sets) {
          if (s.orderIndex === undefined || s.orderIndex === null) {
            throw new Error("SetProgram.orderIndex must be set before insert");
          }
          if (!s.createdAt || !s.updatedAt) {
            throw new Error(
              "SetProgram.createdAt/updatedAt must be set before insert"
            );
          }

          const setProgramId = s.id ?? generateId();

          setRows.push({
            id: setProgramId,
            exerciseProgramId,
            orderIndex: s.orderIndex,
            targetQuantity: s.targetQuantity ?? null,
            loadUnit: s.loadUnit as any, // domain must already hold a valid LoadUnit
            loadValue:
              s.loadValue === null || s.loadValue === undefined
                ? null
                : String(s.loadValue),
            targetRpe: s.targetRpe ?? null,
            note: s.note ?? null,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          });
        }
      }

      // 4. Insert child rows
      if (exerciseRows.length > 0) {
        await tx.insert(exercisePrograms).values(exerciseRows);
      }
      if (setRows.length > 0) {
        await tx.insert(setPrograms).values(setRows);
      }
    });

    return withId;
  }

  protected async update(
    entity: WorkoutProgram & { id?: string | null }
  ): Promise<WorkoutProgram> {
    if (!entity.id) {
      throw new Error("Cannot update WorkoutProgram without id");
    }

    const programRow = WorkoutProgramRowFactory.toRow(entity as WorkoutProgram);
    const { id: _ignore, ...programUpdate } = programRow;

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

      const dbSets = await tx
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
      // 3) MAP domain children into rows keyed by id
      //
      const domainExerciseRows = new Map<
        string,
        typeof exercisePrograms.$inferInsert
      >();

      const domainSetRows = new Map<string, typeof setPrograms.$inferInsert>();

      // ---- YOU MUST MAP YOUR DOMAIN HERE ----
      for (const ex of entity.exercises) {
        domainExerciseRows.set(ex.id, {
          id: ex.id,
          workoutProgramId: entity.id!,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          note: ex.note ?? null,
          createdAt: ex.createdAt.toISOString(),
          updatedAt: ex.updatedAt.toISOString(),
        });

        for (const s of ex.sets) {
          domainSetRows.set(s.id, {
            id: s.id,
            exerciseProgramId: ex.id,
            orderIndex: s.orderIndex,
            targetQuantity: s.targetQuantity,
            loadUnit: s.loadUnit,
            loadValue:
              s.loadValue === null || s.loadValue === undefined
                ? null
                : String(s.loadValue),
            targetRpe: s.targetRpe,
            note: s.note ?? null,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          });
        }
      }
      // ----------------------------------------

      //
      // 4) DIFF – Decide insert/update/delete for exercises
      //
      const exercisesToInsert = [];
      const exercisesToUpdate = [];
      const exercisesToDelete = [];

      for (const [id, row] of domainExerciseRows) {
        if (dbExerciseIds.has(id)) exercisesToUpdate.push(row);
        else exercisesToInsert.push(row);
      }

      for (const id of dbExerciseIds) {
        if (!domainExerciseRows.has(id)) exercisesToDelete.push(id);
      }

      //
      // 5) DIFF – Decide insert/update/delete for sets
      //
      const setsToInsert = [];
      const setsToUpdate = [];
      const setsToDelete = [];

      for (const [id, row] of domainSetRows) {
        if (dbSetIds.has(id)) setsToUpdate.push(row);
        else setsToInsert.push(row);
      }

      for (const id of dbSetIds) {
        if (!domainSetRows.has(id)) setsToDelete.push(id);
      }

      //
      // 6) APPLY MUTATIONS IN CORRECT ORDER
      //

      // --- DELETE sets removed in domain ---
      if (setsToDelete.length > 0) {
        await tx
          .delete(setPrograms)
          .where(inArray(setPrograms.id, setsToDelete));
      }

      // --- DELETE exercises removed in domain ---
      if (exercisesToDelete.length > 0) {
        await tx
          .delete(exercisePrograms)
          .where(inArray(exercisePrograms.id, exercisesToDelete));
      }

      // --- UPDATE existing exercises ---
      for (const row of exercisesToUpdate) {
        await tx
          .update(exercisePrograms)
          .set(row)
          .where(eq(exercisePrograms.id, row.id!));
      }

      // --- INSERT new exercises ---
      if (exercisesToInsert.length > 0) {
        await tx.insert(exercisePrograms).values(exercisesToInsert);
      }

      // --- UPDATE existing sets ---
      for (const row of setsToUpdate) {
        await tx
          .update(setPrograms)
          .set(row)
          .where(eq(setPrograms.id, row.id!));
      }

      // --- INSERT new sets ---
      if (setsToInsert.length > 0) {
        await tx.insert(setPrograms).values(setsToInsert);
      }
    });

    return entity as WorkoutProgram;
  }

  async delete(id: string): Promise<void> {
    await db.delete(workoutPrograms).where(eq(workoutPrograms.id, id));
  }
}

export const workoutProgramRepository = new WorkoutProgramRepository();
