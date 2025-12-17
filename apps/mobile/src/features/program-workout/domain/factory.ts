// src/features/program-workout/domain/workout-program-factory.ts

import type {
  ProgramColor,
  WorkoutProgram,
  WorkoutProgramFormData,
} from "@/src/features/program-workout/domain/type";
import type { WorkoutProgramRow } from "@/src/features/program-workout/data/type";

import type {
  ExerciseProgram,
  ExerciseProgramFormData,
} from "@/src/features/program-exercise/domain/type";
import type { ExerciseProgramRow } from "@/src/features/program-exercise/data/type";

import { SetProgramRow } from "@/src/features/program-set/data/type";
import { ExerciseProgramFactory } from "../../program-exercise/data/factory";

const toIso = (d: Date) => d.toISOString();
const fromIso = (s: string) => new Date(s);

export class WorkoutProgramFactory {
  // -----------------------------
  // DB -> Domain (FULL STRUCTURE)
  // -----------------------------
  static domainFromDb(row: WorkoutProgramRow): WorkoutProgram {
    const exercises: ExerciseProgram[] = (row.exercisePrograms ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((ep: ExerciseProgramRow) => ExerciseProgramFactory.domainFromDb(ep));

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      folderId: row.folderId ?? null,
      color: row.color as ProgramColor,
      createdAt: fromIso(row.createdAt),
      updatedAt: fromIso(row.updatedAt),
      exercises,
    };
  }

  // -----------------------------
  // Domain -> DB (FLATTENED PAYLOAD)
  // -----------------------------
  static dbFromDomain(domain: WorkoutProgram): {
    workoutPrograms: WorkoutProgramRow[];
    exercisePrograms: ExerciseProgramRow[];
    setPrograms: SetProgramRow[];
  } {
    const workoutProgramRow: WorkoutProgramRow = {
      id: domain.id,
      name: domain.name,
      description: domain.description ?? null,
      folderId: domain.folderId ?? null,
      color: domain.color,
      createdAt: toIso(domain.createdAt),
      updatedAt: toIso(domain.updatedAt),
      // hydrated-only
      exercisePrograms: undefined,
    };

    const exercisePrograms: ExerciseProgramRow[] = [];
    const setPrograms: SetProgramRow[] = [];

    const orderedExercises = (domain.exercises ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex);

    for (const ex of orderedExercises) {
      const graph = ExerciseProgramFactory.dbFromDomain(ex);
      exercisePrograms.push(...graph.exercisePrograms);
      setPrograms.push(...graph.setPrograms);
    }

    return {
      workoutPrograms: [workoutProgramRow],
      exercisePrograms,
      setPrograms,
    };
  }

  // -----------------------------
  // Form -> Domain (FULL STRUCTURE)
  // -----------------------------
  static domainFromForm(input: {
    id: string;
    form: WorkoutProgramFormData;
    createdAt: Date;
    updatedAt: Date;
  }): WorkoutProgram {
    const exercises: ExerciseProgram[] = (input.form.exercises ?? []).map(
      (ep: ExerciseProgramFormData, i: number) =>
        ExerciseProgramFactory.domainFromForm({
          form: ep,
          workoutProgramId: input.id,
          exerciseId: ep.exerciseId,
          orderIndex: i + 1,
          note: null,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
          exercise: undefined,
        })
    );

    return {
      id: input.id,
      name: input.form.name.trim(),
      description:
        input.form.description.trim() === "" ? null : input.form.description,
      folderId: input.form.folderId ?? null,
      color: input.form.color,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      exercises,
    };
  }

  // -----------------------------
  // Domain -> Form (FULL STRUCTURE)
  // -----------------------------
  static formFromDomain(domain: WorkoutProgram): WorkoutProgramFormData {
    return {
      name: domain.name,
      description: domain.description ?? "",
      folderId: domain.folderId ?? null,
      color: domain.color,
      exercises: (domain.exercises ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((ep) => ExerciseProgramFactory.formFromDomain(ep)),
    };
  }

  // -----------------------------
  // DB -> Form (FULL STRUCTURE)
  // -----------------------------
  static formFromDb(row: WorkoutProgramRow): WorkoutProgramFormData {
    return this.formFromDomain(this.domainFromDb(row));
  }

  // -----------------------------
  // Form -> DB (FLATTENED PAYLOAD)
  // -----------------------------
  static dbFromForm(input: {
    id: string;
    form: WorkoutProgramFormData;
    createdAt: Date;
    updatedAt: Date;
  }): {
    workoutPrograms: WorkoutProgramRow[];
    exercisePrograms: ExerciseProgramRow[];
    setPrograms: SetProgramRow[];
  } {
    return this.dbFromDomain(
      this.domainFromForm({
        id: input.id,
        form: input.form,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
    );
  }
}
