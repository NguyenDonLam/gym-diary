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
import { generateId } from "@/src/lib/id";

const toIso = (d: Date) => d.toISOString();
const fromIso = (s: string) => new Date(s);

export class WorkoutProgramFactory {
  // -----------------------------
  // DB -> Domain (FULL STRUCTURE)
  // -----------------------------
  static domainFromDb(row: WorkoutProgramRow): WorkoutProgram {
    const exercises: ExerciseProgram[] = (row.exercises ?? [])
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
      exercises: undefined,
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
  static domainFromForm(form: WorkoutProgramFormData): WorkoutProgram {
    const now = new Date();
    const id = generateId();

    const exercises: ExerciseProgram[] = (form.exercises ?? []).map(
      (ep: ExerciseProgramFormData, i: number) =>
        ExerciseProgramFactory.domainFromForm({
          form: ep,
          workoutProgramId: id,
          exerciseId: ep.exerciseId!, //TODO: proper typing here
          orderIndex: i + 1,
          note: null,
          createdAt: now,
          updatedAt: now,
          exercise: undefined,
        })
    );

    return {
      id,
      name: (form.name ?? "").trim(),
      description:
        (form.description ?? "").trim() === "" ? null : form.description,
      folderId: form.folderId ?? null,
      color: form.color ?? "neutral",
      createdAt: now,
      updatedAt: now,
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
  static dbFromForm(form: WorkoutProgramFormData): {
    workoutPrograms: WorkoutProgramRow[];
    exercisePrograms: ExerciseProgramRow[];
    setPrograms: SetProgramRow[];
  } {
    return this.dbFromDomain(this.domainFromForm(form));
  }

  // -----------------------------
  // Create (Domain) — partial in, defaults out
  // -----------------------------
  static create(overrides: Partial<WorkoutProgram> = {}): WorkoutProgram {
    const now = new Date();

    const fallbackId = generateId();

    return {
      id: overrides.id ?? fallbackId,
      name: (overrides.name ?? "").trim(),
      description: overrides.description ?? null,
      folderId: overrides.folderId ?? null,
      color: overrides.color ?? "neutral",
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      exercises: (overrides.exercises ?? [])
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex),
    };
  }

  // -----------------------------
  // Create (Form) — partial in, defaults out
  // -----------------------------
  static createForm(
    overrides: Partial<WorkoutProgramFormData> = {}
  ): WorkoutProgramFormData {
    return {
      name: overrides.name ?? "",
      description: overrides.description ?? "",
      folderId: overrides.folderId ?? null,
      color: overrides.color ?? "neutral",
      exercises: (overrides.exercises ?? []).slice(),
    };
  }
}
