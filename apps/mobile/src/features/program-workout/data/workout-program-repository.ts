import { eq, asc } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { exercisePrograms, workoutPrograms } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { WorkoutProgramRowFactory } from "./row-factory";
import { WorkoutProgram } from "../domain/type";

export class WorkoutProgramRepository extends BaseRepository<WorkoutProgram> {
  constructor() {
    super();
  }

  async get(id: string): Promise<WorkoutProgram | null> {
    const program = await db.query.workoutPrograms.findFirst({
      where: (wp) => eq(wp.id, id),
      with: {
        exercises: {
          with: {
            sets: true,
          },
          orderBy: (ex: typeof exercisePrograms) => [asc(ex.orderIndex)],
        },
      },
    });

    if (!program) return null;

    return WorkoutProgramRowFactory.fromQuery(program);
  }

  async getAll(): Promise<WorkoutProgram[]> {
    const programs = await db.query.workoutPrograms.findMany({
      with: {
        exercises: {
          with: {
            sets: true,
          },
          orderBy: (ex: typeof exercisePrograms) => [asc(ex.orderIndex)],
        },
      },
      orderBy: (wp) => [asc(wp.createdAt)],
    });

    return programs.map((p) => WorkoutProgramRowFactory.fromQuery(p));
  }

  protected async insert(
    entity: WorkoutProgram & { id?: string | null }
  ): Promise<WorkoutProgram> {
    const id = entity.id ?? generateId();
    const withId: WorkoutProgram = { ...(entity as WorkoutProgram), id };

    const row = WorkoutProgramRowFactory.toRow(withId);
    await db.insert(workoutPrograms).values(row);

    return withId;
  }

  protected async update(
    entity: WorkoutProgram & { id?: string | null }
  ): Promise<WorkoutProgram> {
    if (!entity.id) {
      throw new Error("Cannot update WorkoutProgram without id");
    }

    const row = WorkoutProgramRowFactory.toRow(entity as WorkoutProgram);

    await db
      .update(workoutPrograms)
      .set(row)
      .where(eq(workoutPrograms.id, entity.id));

    return entity as WorkoutProgram;
  }

  async delete(id: string): Promise<void> {
    await db.delete(workoutPrograms).where(eq(workoutPrograms.id, id));
  }
}

export const workoutProgramRepository = new WorkoutProgramRepository();
