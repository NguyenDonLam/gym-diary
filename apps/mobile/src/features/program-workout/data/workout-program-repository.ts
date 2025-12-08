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
    console.log("fetching");

    try {
      const program = await db.query.workoutPrograms.findFirst({
        where: (wp, { eq }) => eq(wp.id, id),
        with: {
          exercises: {
            with: {
              sets: true,
            },
            orderBy: (ex, { asc }) => [asc(ex.orderIndex)],
          },
        },
      });

      console.log("fetched");

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

  // full aggregate for editing / starting sessions
  async getWithChildren(id: string): Promise<WorkoutProgram | null> {
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
